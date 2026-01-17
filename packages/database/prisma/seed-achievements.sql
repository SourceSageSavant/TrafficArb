-- Create default achievements for the Traffic Arb system
-- Run this after Prisma migrations

INSERT INTO achievements (id, code, name, description, icon_url, requirement, xp_reward, created_at)
VALUES 
    -- Task Completion Achievements
    (gen_random_uuid(), 'first_task', 'First Steps', 'Complete your first task', NULL, '{"type": "tasks_completed", "value": 1}', 10, NOW()),
    (gen_random_uuid(), 'task_10', 'Novice Tasker', 'Complete 10 tasks', NULL, '{"type": "tasks_completed", "value": 10}', 50, NOW()),
    (gen_random_uuid(), 'task_50', 'Task Master', 'Complete 50 tasks', NULL, '{"type": "tasks_completed", "value": 50}', 200, NOW()),
    (gen_random_uuid(), 'task_100', 'Task Legend', 'Complete 100 tasks', NULL, '{"type": "tasks_completed", "value": 100}', 500, NOW()),
    (gen_random_uuid(), 'task_500', 'Task Titan', 'Complete 500 tasks', NULL, '{"type": "tasks_completed", "value": 500}', 2000, NOW()),

    -- Referral Achievements
    (gen_random_uuid(), 'first_referral', 'Social Butterfly', 'Invite your first friend', NULL, '{"type": "referrals", "value": 1}', 25, NOW()),
    (gen_random_uuid(), 'referral_5', 'Team Builder', 'Invite 5 friends', NULL, '{"type": "referrals", "value": 5}', 125, NOW()),
    (gen_random_uuid(), 'referral_25', 'Network King', 'Invite 25 friends', NULL, '{"type": "referrals", "value": 25}', 500, NOW()),
    (gen_random_uuid(), 'referral_100', 'Viral Sensation', 'Invite 100 friends', NULL, '{"type": "referrals", "value": 100}', 2500, NOW()),

    -- Streak Achievements
    (gen_random_uuid(), 'streak_7', 'Week Warrior', 'Maintain a 7-day streak', NULL, '{"type": "streak", "value": 7}', 100, NOW()),
    (gen_random_uuid(), 'streak_30', 'Month Strong', 'Maintain a 30-day streak', NULL, '{"type": "streak", "value": 30}', 500, NOW()),
    (gen_random_uuid(), 'streak_100', 'Streak Legend', 'Maintain a 100-day streak', NULL, '{"type": "streak", "value": 100}', 2000, NOW()),

    -- Earnings Achievements
    (gen_random_uuid(), 'earned_1', 'First TON', 'Earn your first 1 TON', NULL, '{"type": "total_earned", "value": 1}', 20, NOW()),
    (gen_random_uuid(), 'earned_10', 'Double Digits', 'Earn 10 TON total', NULL, '{"type": "total_earned", "value": 10}', 150, NOW()),
    (gen_random_uuid(), 'earned_100', 'Century Club', 'Earn 100 TON total', NULL, '{"type": "total_earned", "value": 100}', 1000, NOW()),
    (gen_random_uuid(), 'earned_1000', 'TON Millionaire', 'Earn 1000 TON total', NULL, '{"type": "total_earned", "value": 1000}', 5000, NOW()),

    -- Level Achievements
    (gen_random_uuid(), 'level_5', 'Getting Started', 'Reach level 5', NULL, '{"type": "level", "value": 5}', 50, NOW()),
    (gen_random_uuid(), 'level_10', 'Rising Star', 'Reach level 10', NULL, '{"type": "level", "value": 10}', 200, NOW()),
    (gen_random_uuid(), 'level_25', 'Pro Player', 'Reach level 25', NULL, '{"type": "level", "value": 25}', 750, NOW()),
    (gen_random_uuid(), 'level_50', 'Elite Status', 'Reach level 50', NULL, '{"type": "level", "value": 50}', 2500, NOW())
ON CONFLICT (code) DO NOTHING;
