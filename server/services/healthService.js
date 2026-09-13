// Health & Wellness Service: Wearable Integrations, Hydration Engine, Meal Protection
const { db } = require('../db');

const WEARABLE_PROVIDERS = [
  { id: 'apple', name: 'Apple Health / HealthKit', icon: '🍎', supportedMetrics: ['steps', 'heart_rate', 'sleep', 'mindfulness'] },
  { id: 'google', name: 'Google Health Connect', icon: '🤖', supportedMetrics: ['steps', 'heart_rate', 'sleep', 'active_minutes'] },
  { id: 'fitbit', name: 'Fitbit Web API', icon: '⌚', supportedMetrics: ['steps', 'heart_rate', 'sleep', 'calories'] },
  { id: 'garmin', name: 'Garmin Health API', icon: '🧭', supportedMetrics: ['steps', 'heart_rate', 'stress', 'body_battery'] },
  { id: 'samsung', name: 'Samsung Health SDK', icon: '📱', supportedMetrics: ['steps', 'heart_rate', 'sleep'] }
];

// Check for schedule collisions between planned study tasks and health priorities
function checkHealthCollisions(userId, taskStartTime, durationMins) {
  const taskStart = new Date(taskStartTime);
  const taskEnd = new Date(taskStart.getTime() + durationMins * 60000);

  const collisions = [];

  // 1. Check Meals
  const meals = db.prepare('SELECT meal_type, scheduled_time, duration_mins FROM meal_schedule WHERE user_id = ? AND is_enabled = 1').all(userId);

  const taskTimeStr = taskStart.toTimeString().slice(0, 5); // "HH:MM"
  const taskEndTimeStr = taskEnd.toTimeString().slice(0, 5);

  meals.forEach(m => {
    // Basic time overlap check
    if (m.scheduled_time >= taskTimeStr && m.scheduled_time <= taskEndTimeStr) {
      collisions.push({
        type: 'MEAL_COLLISION',
        priority: 'CRITICAL',
        title: `Protect ${m.meal_type} Schedule`,
        message: `Your planned task overlaps with scheduled ${m.meal_type} at ${m.scheduled_time}. StudyFlow AI recommends shifting your study task or taking a meal pause.`,
        suggestedAdjustment: `Move study session 30 minutes forward or break into 2 focused sprints.`
      });
    }
  });

  // 2. Check Sleep Boundaries (e.g., after 23:30 or before 06:30)
  const taskHour = taskStart.getHours();
  if (taskHour >= 23 || taskHour < 6) {
    collisions.push({
      type: 'SLEEP_PROTECTION',
      priority: 'CRITICAL',
      title: 'Protect Nighttime Sleep Schedule',
      message: 'Late-night cramming impairs long-term memory consolidation and cognitive recall. Deep sleep is essential for optimal exam performance.',
      suggestedAdjustment: 'Reschedule this session to morning after at least 7 hours of restful sleep.'
    });
  }

  // 3. Check Duration / Hydration Break requirement (sessions > 60 mins need hydration breaks)
  if (durationMins > 60) {
    collisions.push({
      type: 'HYDRATION_BREAK_REQUIRED',
      priority: 'RECOMMENDED',
      title: 'Hydration & Movement Interval Required',
      message: `Continuous focus over 60 minutes degrades retention. We automatically insert a 10-minute water and stretch break at the 50-minute mark.`,
      suggestedAdjustment: 'Split into 50m Focus + 10m Hydration Break.'
    });
  }

  return collisions;
}

// Get full wellness status
function getWellnessSummary(userId) {
  // Today's hydration
  const todayHydration = db.prepare(`
    SELECT COALESCE(SUM(amount_ml), 0) as total_ml, COUNT(*) as logs_count
    FROM hydration_logs
    WHERE user_id = ? AND date(logged_at) = date('now')
  `).get(userId);

  const userSettings = db.prepare('SELECT daily_water_goal_ml FROM user_settings WHERE user_id = ?').get(userId);
  const goalMl = userSettings ? userSettings.daily_water_goal_ml : 2500;
  const glasses = Math.floor((todayHydration ? todayHydration.total_ml : 0) / 250);
  const goalGlasses = Math.floor(goalMl / 250);

  // Today's wellness log
  let todayLog = db.prepare(`
    SELECT * FROM wellness_logs
    WHERE user_id = ? AND log_date = date('now')
    ORDER BY id DESC LIMIT 1
  `).get(userId);

  if (!todayLog) {
    todayLog = {
      sleep_hours: 7.2,
      sleep_quality: 'Restful',
      steps: 4820,
      active_minutes: 45,
      avg_heart_rate: 72,
      resting_heart_rate: 64,
      mood: 'Focused',
      is_demo_data: 1
    };
  }

  // Next meal
  const meals = db.prepare(`
    SELECT * FROM meal_schedule
    WHERE user_id = ? AND is_enabled = 1
    ORDER BY scheduled_time ASC
  `).all(userId);

  const nowTime = new Date().toTimeString().slice(0, 5);
  let nextMeal = meals.find(m => m.scheduled_time > nowTime) || meals[0] || { meal_type: 'Lunch', scheduled_time: '12:30' };

  // Wearable connection status
  const connection = db.prepare(`
    SELECT * FROM wearable_connections
    WHERE user_id = ?
    ORDER BY id DESC LIMIT 1
  `).get(userId);

  return {
    hydration: {
      current_ml: todayHydration ? todayHydration.total_ml : 0,
      goal_ml: goalMl,
      glasses_count: glasses,
      glasses_goal: goalGlasses,
      percentage: Math.min(100, Math.round(((todayHydration ? todayHydration.total_ml : 0) / goalMl) * 100))
    },
    next_meal: nextMeal,
    activity: {
      steps: todayLog.steps,
      active_minutes: todayLog.active_minutes,
      heart_rate_bpm: todayLog.avg_heart_rate,
      resting_hr: todayLog.resting_heart_rate,
      sleep_hours: todayLog.sleep_hours,
      sleep_quality: todayLog.sleep_quality,
      mood: todayLog.mood,
      is_demo_data: Boolean(todayLog.is_demo_data)
    },
    wearable: connection ? {
      provider: connection.provider,
      status: connection.status,
      device_name: connection.device_name,
      last_sync: connection.last_sync_at,
      is_demo: Boolean(connection.is_demo)
    } : {
      status: 'Not Connected',
      provider: null,
      device_name: null,
      is_demo: false
    }
  };
}

module.exports = {
  WEARABLE_PROVIDERS,
  checkHealthCollisions,
  getWellnessSummary
};
