/*
 Navicat Premium Data Transfer

 Source Server         : cf-nextjs-vip
 Source Server Type    : SQLite
 Source Server Version : 3035005 (3.35.5)
 Source Schema         : main

 Target Server Type    : SQLite
 Target Server Version : 3035005 (3.35.5)
 File Encoding         : 65001

 Date: 10/02/2026 17:09:10
*/

PRAGMA foreign_keys = false;

-- ----------------------------
-- Table structure for _cf_METADATA
-- ----------------------------
DROP TABLE IF EXISTS "_cf_METADATA";
CREATE TABLE _cf_METADATA (
        key INTEGER PRIMARY KEY,
        value BLOB
      );

-- ----------------------------
-- Records of _cf_METADATA
-- ----------------------------
BEGIN;
INSERT INTO "_cf_METADATA" ("key", "value") VALUES (2, 908);
COMMIT;

-- ----------------------------
-- Table structure for members
-- ----------------------------
DROP TABLE IF EXISTS "members";
CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    balance REAL DEFAULT 0, 
    points INTEGER DEFAULT 0, 
    remark TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
, gender TEXT DEFAULT 'unknown', address TEXT, channel TEXT, status TEXT DEFAULT 'active');

-- ----------------------------
-- Records of members
-- ----------------------------
BEGIN;
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (1, '陈威龙', '17805135477', 500.0, 500, '新用户', '2026-02-10 08:09:56', '2026-02-10 08:26:19', 'unknown', '', '推广', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (2, '陈威龙', '13092471542', 500.0, 0, '111', '2026-02-10 08:20:40', '2026-02-10 08:48:29', 'male', '测试1', '门店', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (3, '李敏', '13159994210', 125.1, 7544, NULL, '2026-01-27T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (4, '李军', '18432927628', 95.77, 1095, NULL, '2026-01-30T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (5, '黄敏', '11893233419', 144.61, 2037, NULL, '2026-02-07T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (6, '李强', '14436913986', 394.29, 9843, NULL, '2026-01-23T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (7, '赵强', '10827658044', 473.56, 9594, NULL, '2026-01-13T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (8, '黄敏', '19918585402', 48.13, 426, NULL, '2026-02-10T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (9, '周敏', '16442373884', 39.33, 3052, NULL, '2026-02-08T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (10, '张敏', '12896051815', 453.21, 635, NULL, '2026-01-26T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (11, '张敏', '19128787293', 445.06, 3335, NULL, '2026-02-10T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (12, '张明', '17733287348', 426.06, 1448, NULL, '2026-02-02T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (13, '黄娜', '11025493206', 106.65, 1269, NULL, '2026-02-05T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (14, '陈军', '14237578125', 50.65, 7465, NULL, '2026-01-24T08:58:34.173Z', '2026-02-10 08:58:34', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (15, '吴洋', '15386956611', 494.19, 1318, NULL, '2026-02-09T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (16, '李娜', '19190170083', 61.23, 725, NULL, '2026-01-27T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (17, '李强', '14612452367', 164.28, 3067, NULL, '2026-01-25T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (18, '李娜', '13251470891', 279.69, 1983, NULL, '2026-01-27T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (19, '周军', '19400676861', 203.18, 6910, NULL, '2026-01-23T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (20, '张杰', '15190287861', 404.47, 9629, NULL, '2026-02-07T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (21, '赵明', '13428223983', 32.88, 2108, NULL, '2026-01-28T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (22, '陈明', '11958922016', 19.39, 4881, NULL, '2026-02-05T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (23, '吴洋', '19048196110', 184.66, 8285, NULL, '2026-02-09T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (24, '杨红', '13015154062', 13.15, 2814, NULL, '2026-01-15T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (25, '杨娜', '15301011368', 103.43, 1067, NULL, '2026-01-16T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (26, '黄杰', '11471157851', 223.36, 3572, NULL, '2026-02-04T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (27, '周芳', '14830710744', 78.49, 3925, NULL, '2026-01-30T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (28, '陈芳', '15539907151', 23.94, 6328, NULL, '2026-01-24T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (29, '李强', '17598473433', 241.37, 2384, NULL, '2026-02-08T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (30, '吴杰', '16009245076', 362.72, 5830, NULL, '2026-02-06T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (31, '张芳', '15247004481', 357.67, 5349, NULL, '2026-01-31T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (32, '陈静', '18812163802', 212.59, 8255, NULL, '2026-01-15T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (33, '杨红', '19719028522', 481.79, 2506, NULL, '2026-02-06T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (34, '杨静', '12812829389', 109.39, 6392, NULL, '2026-01-14T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (35, '周芳', '13208891873', 189.68, 7564, NULL, '2026-01-31T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (36, '张红', '18261876074', 62.57, 5, NULL, '2026-02-06T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (37, '王明', '14091396138', 431.55, 6561, NULL, '2026-01-29T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (38, '杨军', '13921457194', 24.49, 6541, NULL, '2026-02-06T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (39, '王洋', '11105730475', 194.69, 4448, NULL, '2026-02-01T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (40, '吴强', '10697201312', 327.17, 6986, NULL, '2026-01-15T08:58:34.173Z', '2026-02-10 08:58:35', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (41, '赵伟', '10064698613', 443.88, 3687, NULL, '2026-01-19T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (42, '刘洋', '11108339847', 269.3, 6044, NULL, '2026-01-18T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (43, '刘洋', '12876701006', 30.85, 676, NULL, '2026-01-16T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (44, '刘明', '16458980899', 83.39, 306, NULL, '2026-02-04T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (45, '周洋', '17414588937', 458.92, 1856, NULL, '2026-02-08T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (46, '张丽', '17121783837', 136.46, 5735, NULL, '2026-01-14T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (47, '周洋', '13266728009', 172.36, 1750, NULL, '2026-02-03T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (48, '刘军', '17047804385', 265.2, 9819, NULL, '2026-01-24T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'web', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (49, '陈敏', '19863495345', 159.71, 3350, NULL, '2026-01-28T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'referral', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (50, '赵芳', '11922548484', 443.81, 6465, NULL, '2026-02-09T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'store', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (51, '吴静', '16936013189', 494.37, 7998, NULL, '2026-02-02T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'wechat', 'active');
INSERT INTO "members" ("id", "name", "phone", "balance", "points", "remark", "created_at", "updated_at", "gender", "address", "channel", "status") VALUES (52, '杨伟', '12598039571', 469.37, 1676, NULL, '2026-02-02T08:58:34.173Z', '2026-02-10 08:58:36', 'unknown', NULL, 'referral', 'active');
COMMIT;

-- ----------------------------
-- Table structure for sqlite_sequence
-- ----------------------------
DROP TABLE IF EXISTS "sqlite_sequence";
CREATE TABLE sqlite_sequence(name,seq);

-- ----------------------------
-- Records of sqlite_sequence
-- ----------------------------
BEGIN;
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('users', 1);
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('members', 52);
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('transactions', 306);
COMMIT;

-- ----------------------------
-- Table structure for transactions
-- ----------------------------
DROP TABLE IF EXISTS "transactions";
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    type TEXT NOT NULL, 
    amount REAL NOT NULL, 
    balance_after REAL NOT NULL, 
    remark TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- ----------------------------
-- Records of transactions
-- ----------------------------
BEGIN;
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (1, 1, 'balance', 500.0, 500.0, '初始化重置', '2026-02-10 08:10:21');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (2, 1, 'points', 500.0, 500.0, '测试', '2026-02-10 08:18:47');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (3, 2, 'balance', 500.0, 500.0, '1', '2026-02-10 08:48:29');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (4, 3, 'points', 85.0, 0.0, '消费赠送', '2026-01-15T08:58:34.301Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (5, 3, 'balance', -363.0, 0.0, '消费', '2026-01-27T08:58:34.329Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (6, 3, 'balance', -148.0, 0.0, '消费', '2026-02-10T08:58:34.338Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (7, 3, 'balance', 451.0, 0.0, '充值', '2026-01-19T08:58:34.342Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (8, 3, 'points', 18.0, 0.0, '活动奖励', '2026-01-23T08:58:34.348Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (9, 3, 'points', 97.0, 0.0, '消费赠送', '2026-02-04T08:58:34.353Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (10, 4, 'points', 35.0, 0.0, '活动奖励', '2026-01-25T08:58:34.373Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (11, 4, 'balance', 416.0, 0.0, '充值', '2026-01-18T08:58:34.378Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (12, 4, 'balance', 148.0, 0.0, '充值', '2026-01-29T08:58:34.383Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (13, 4, 'points', 49.0, 0.0, '活动奖励', '2026-02-05T08:58:34.388Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (14, 4, 'points', 0.0, 0.0, '签到', '2026-01-22T08:58:34.393Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (15, 4, 'balance', 42.0, 0.0, '充值', '2026-02-04T08:58:34.397Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (16, 4, 'balance', -282.0, 0.0, '消费', '2026-01-19T08:58:34.402Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (17, 4, 'points', -49.0, 0.0, '积分兑换', '2026-02-02T08:58:34.407Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (18, 4, 'balance', -16.0, 0.0, '消费', '2026-01-23T08:58:34.411Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (19, 5, 'balance', -454.0, 0.0, '消费', '2026-02-01T08:58:34.429Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (20, 5, 'points', 10.0, 0.0, '消费赠送', '2026-02-08T08:58:34.437Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (21, 6, 'balance', -5.0, 0.0, '消费', '2026-01-27T08:58:34.458Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (22, 6, 'balance', -28.0, 0.0, '消费', '2026-01-25T08:58:34.463Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (23, 6, 'balance', -59.0, 0.0, '消费', '2026-01-19T08:58:34.468Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (24, 6, 'points', 19.0, 0.0, '活动奖励', '2026-01-20T08:58:34.473Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (25, 6, 'points', 86.0, 0.0, '活动奖励', '2026-01-26T08:58:34.476Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (26, 6, 'points', 18.0, 0.0, '签到', '2026-02-09T08:58:34.480Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (27, 6, 'points', 54.0, 0.0, '签到', '2026-01-24T08:58:34.484Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (28, 7, 'balance', -490.0, 0.0, '消费', '2026-01-14T08:58:34.495Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (29, 7, 'points', -42.0, 0.0, '积分兑换', '2026-01-21T08:58:34.499Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (30, 7, 'points', -2.0, 0.0, '积分兑换', '2026-02-03T08:58:34.504Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (31, 7, 'balance', -96.0, 0.0, '消费', '2026-01-17T08:58:34.512Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (32, 7, 'points', -26.0, 0.0, '积分兑换', '2026-01-17T08:58:34.526Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (33, 7, 'points', 59.0, 0.0, '活动奖励', '2026-01-21T08:58:34.534Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (34, 7, 'balance', -315.0, 0.0, '消费', '2026-02-08T08:58:34.550Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (35, 8, 'balance', 972.0, 0.0, '充值', '2026-01-16T08:58:34.612Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (36, 8, 'balance', 780.0, 0.0, '充值', '2026-02-08T08:58:34.638Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (37, 8, 'balance', -277.0, 0.0, '消费', '2026-01-30T08:58:34.649Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (38, 8, 'points', 4.0, 0.0, '签到', '2026-01-24T08:58:34.656Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (39, 8, 'points', 17.0, 0.0, '活动奖励', '2026-02-09T08:58:34.660Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (40, 8, 'balance', -329.0, 0.0, '消费', '2026-01-21T08:58:34.666Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (41, 8, 'balance', -57.0, 0.0, '消费', '2026-02-04T08:58:34.671Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (42, 8, 'balance', 429.0, 0.0, '充值', '2026-02-04T08:58:34.676Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (43, 9, 'balance', -190.0, 0.0, '消费', '2026-02-04T08:58:34.688Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (44, 9, 'points', 72.0, 0.0, '活动奖励', '2026-02-06T08:58:34.691Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (45, 9, 'balance', -260.0, 0.0, '消费', '2026-01-12T08:58:34.696Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (46, 9, 'points', -18.0, 0.0, '积分兑换', '2026-01-17T08:58:34.701Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (47, 9, 'balance', -472.0, 0.0, '消费', '2026-01-31T08:58:34.708Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (48, 9, 'points', -45.0, 0.0, '积分兑换', '2026-02-04T08:58:34.713Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (49, 9, 'points', -46.0, 0.0, '积分兑换', '2026-01-16T08:58:34.716Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (50, 9, 'balance', -327.0, 0.0, '消费', '2026-01-14T08:58:34.722Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (51, 9, 'balance', 107.0, 0.0, '充值', '2026-02-09T08:58:34.725Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (52, 10, 'points', 35.0, 0.0, '签到', '2026-01-24T08:58:34.737Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (53, 10, 'balance', 527.0, 0.0, '充值', '2026-01-18T08:58:34.740Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (54, 11, 'balance', 127.0, 0.0, '充值', '2026-01-24T08:58:34.761Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (55, 11, 'points', 57.0, 0.0, '消费赠送', '2026-01-28T08:58:34.781Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (56, 11, 'balance', 515.0, 0.0, '充值', '2026-02-09T08:58:34.795Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (57, 12, 'balance', -105.0, 0.0, '消费', '2026-01-31T08:58:34.842Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (58, 12, 'points', 23.0, 0.0, '活动奖励', '2026-02-06T08:58:34.850Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (59, 12, 'balance', 222.0, 0.0, '充值', '2026-01-28T08:58:34.864Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (60, 12, 'balance', -332.0, 0.0, '消费', '2026-02-05T08:58:34.884Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (61, 12, 'balance', 764.0, 0.0, '充值', '2026-01-20T08:58:34.899Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (62, 12, 'points', 18.0, 0.0, '签到', '2026-01-31T08:58:34.905Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (63, 12, 'balance', -116.0, 0.0, '消费', '2026-01-19T08:58:34.911Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (64, 12, 'points', 49.0, 0.0, '消费赠送', '2026-02-04T08:58:34.916Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (65, 13, 'points', -42.0, 0.0, '积分兑换', '2026-01-25T08:58:34.969Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (66, 13, 'balance', -100.0, 0.0, '消费', '2026-01-13T08:58:34.981Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (67, 13, 'points', 51.0, 0.0, '消费赠送', '2026-02-05T08:58:34.987Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (68, 13, 'points', -31.0, 0.0, '积分兑换', '2026-02-10T08:58:34.992Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (69, 14, 'points', -37.0, 0.0, '积分兑换', '2026-01-15T08:58:35.005Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (70, 14, 'points', 35.0, 0.0, '签到', '2026-01-22T08:58:35.010Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (71, 14, 'points', 62.0, 0.0, '消费赠送', '2026-02-06T08:58:35.021Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (72, 14, 'balance', 160.0, 0.0, '充值', '2026-01-17T08:58:35.033Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (73, 14, 'points', 97.0, 0.0, '消费赠送', '2026-01-15T08:58:35.043Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (74, 14, 'balance', 762.0, 0.0, '充值', '2026-02-05T08:58:35.050Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (75, 14, 'points', -35.0, 0.0, '积分兑换', '2026-01-15T08:58:35.055Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (76, 15, 'balance', -36.0, 0.0, '消费', '2026-02-04T08:58:35.066Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (77, 15, 'balance', 832.0, 0.0, '充值', '2026-02-04T08:58:35.069Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (78, 15, 'points', -24.0, 0.0, '积分兑换', '2026-02-03T08:58:35.073Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (79, 15, 'points', 63.0, 0.0, '活动奖励', '2026-01-15T08:58:35.076Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (80, 16, 'balance', -113.0, 0.0, '消费', '2026-02-09T08:58:35.086Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (81, 16, 'points', 60.0, 0.0, '活动奖励', '2026-02-06T08:58:35.090Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (82, 17, 'balance', -47.0, 0.0, '消费', '2026-01-29T08:58:35.114Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (83, 17, 'balance', 910.0, 0.0, '充值', '2026-02-03T08:58:35.119Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (84, 17, 'balance', -330.0, 0.0, '消费', '2026-01-31T08:58:35.122Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (85, 17, 'points', 61.0, 0.0, '消费赠送', '2026-01-28T08:58:35.126Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (86, 17, 'points', 15.0, 0.0, '活动奖励', '2026-01-24T08:58:35.130Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (87, 18, 'balance', 377.0, 0.0, '充值', '2026-01-17T08:58:35.140Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (88, 18, 'balance', -472.0, 0.0, '消费', '2026-01-23T08:58:35.144Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (89, 19, 'balance', 458.0, 0.0, '充值', '2026-02-07T08:58:35.154Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (90, 19, 'balance', 204.0, 0.0, '充值', '2026-02-06T08:58:35.157Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (91, 20, 'points', 91.0, 0.0, '消费赠送', '2026-01-27T08:58:35.168Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (92, 20, 'balance', -485.0, 0.0, '消费', '2026-01-23T08:58:35.171Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (93, 20, 'balance', -160.0, 0.0, '消费', '2026-01-13T08:58:35.175Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (94, 20, 'points', -15.0, 0.0, '积分兑换', '2026-01-16T08:58:35.181Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (95, 20, 'balance', 479.0, 0.0, '充值', '2026-01-16T08:58:35.185Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (96, 20, 'points', 34.0, 0.0, '消费赠送', '2026-01-28T08:58:35.189Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (97, 20, 'balance', 811.0, 0.0, '充值', '2026-01-19T08:58:35.193Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (98, 20, 'balance', 569.0, 0.0, '充值', '2026-01-17T08:58:35.196Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (99, 20, 'points', -38.0, 0.0, '积分兑换', '2026-02-10T08:58:35.201Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (100, 21, 'balance', -11.0, 0.0, '消费', '2026-01-26T08:58:35.216Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (101, 21, 'points', 94.0, 0.0, '消费赠送', '2026-02-02T08:58:35.220Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (102, 21, 'points', 48.0, 0.0, '消费赠送', '2026-01-25T08:58:35.226Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (103, 21, 'balance', -148.0, 0.0, '消费', '2026-01-20T08:58:35.232Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (104, 21, 'points', 1.0, 0.0, '活动奖励', '2026-02-08T08:58:35.236Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (105, 21, 'points', -34.0, 0.0, '积分兑换', '2026-01-24T08:58:35.246Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (106, 21, 'balance', 303.0, 0.0, '充值', '2026-01-22T08:58:35.254Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (107, 21, 'balance', 514.0, 0.0, '充值', '2026-02-10T08:58:35.259Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (108, 21, 'balance', 116.0, 0.0, '充值', '2026-01-19T08:58:35.265Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (109, 21, 'balance', -175.0, 0.0, '消费', '2026-02-04T08:58:35.271Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (110, 22, 'balance', -33.0, 0.0, '消费', '2026-01-24T08:58:35.283Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (111, 22, 'balance', 218.0, 0.0, '充值', '2026-02-02T08:58:35.288Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (112, 22, 'points', 2.0, 0.0, '签到', '2026-02-05T08:58:35.293Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (113, 22, 'points', 35.0, 0.0, '消费赠送', '2026-01-13T08:58:35.297Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (114, 22, 'points', 11.0, 0.0, '活动奖励', '2026-02-03T08:58:35.301Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (115, 22, 'points', 84.0, 0.0, '签到', '2026-02-09T08:58:35.305Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (116, 23, 'points', 26.0, 0.0, '消费赠送', '2026-01-18T08:58:35.317Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (117, 23, 'balance', 681.0, 0.0, '充值', '2026-02-06T08:58:35.322Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (118, 23, 'balance', -403.0, 0.0, '消费', '2026-02-10T08:58:35.325Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (119, 23, 'balance', -57.0, 0.0, '消费', '2026-02-10T08:58:35.329Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (120, 23, 'balance', 290.0, 0.0, '充值', '2026-02-10T08:58:35.333Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (121, 24, 'balance', -113.0, 0.0, '消费', '2026-02-04T08:58:35.347Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (122, 24, 'points', -40.0, 0.0, '积分兑换', '2026-01-31T08:58:35.355Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (123, 24, 'balance', -12.0, 0.0, '消费', '2026-01-20T08:58:35.367Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (124, 24, 'balance', -339.0, 0.0, '消费', '2026-02-05T08:58:35.373Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (125, 24, 'balance', 921.0, 0.0, '充值', '2026-01-26T08:58:35.381Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (126, 24, 'balance', -133.0, 0.0, '消费', '2026-01-26T08:58:35.389Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (127, 24, 'points', 98.0, 0.0, '消费赠送', '2026-02-10T08:58:35.394Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (128, 24, 'balance', -460.0, 0.0, '消费', '2026-01-12T08:58:35.400Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (129, 24, 'points', 8.0, 0.0, '签到', '2026-01-13T08:58:35.405Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (130, 24, 'points', 94.0, 0.0, '活动奖励', '2026-01-28T08:58:35.412Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (131, 25, 'balance', -219.0, 0.0, '消费', '2026-02-04T08:58:35.429Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (132, 25, 'points', 13.0, 0.0, '活动奖励', '2026-02-02T08:58:35.440Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (133, 25, 'points', -13.0, 0.0, '积分兑换', '2026-02-08T08:58:35.444Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (134, 25, 'points', -24.0, 0.0, '积分兑换', '2026-02-07T08:58:35.448Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (135, 26, 'balance', -250.0, 0.0, '消费', '2026-02-02T08:58:35.458Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (136, 26, 'points', 90.0, 0.0, '签到', '2026-02-06T08:58:35.462Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (137, 26, 'points', -4.0, 0.0, '积分兑换', '2026-02-02T08:58:35.465Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (138, 26, 'balance', -19.0, 0.0, '消费', '2026-01-22T08:58:35.469Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (139, 26, 'balance', 563.0, 0.0, '充值', '2026-01-31T08:58:35.473Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (140, 27, 'balance', -273.0, 0.0, '消费', '2026-01-14T08:58:35.483Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (141, 27, 'balance', -479.0, 0.0, '消费', '2026-01-25T08:58:35.488Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (142, 27, 'points', 28.0, 0.0, '活动奖励', '2026-02-07T08:58:35.492Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (143, 27, 'balance', 50.0, 0.0, '充值', '2026-02-06T08:58:35.495Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (144, 27, 'points', 68.0, 0.0, '消费赠送', '2026-02-03T08:58:35.497Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (145, 27, 'points', -1.0, 0.0, '积分兑换', '2026-02-01T08:58:35.500Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (146, 28, 'balance', -172.0, 0.0, '消费', '2026-01-26T08:58:35.509Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (147, 28, 'points', 34.0, 0.0, '消费赠送', '2026-02-09T08:58:35.512Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (148, 28, 'balance', -65.0, 0.0, '消费', '2026-02-10T08:58:35.514Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (149, 28, 'points', -35.0, 0.0, '积分兑换', '2026-01-26T08:58:35.517Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (150, 28, 'points', 35.0, 0.0, '活动奖励', '2026-02-06T08:58:35.523Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (151, 28, 'points', -41.0, 0.0, '积分兑换', '2026-01-19T08:58:35.528Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (152, 28, 'balance', 498.0, 0.0, '充值', '2026-01-13T08:58:35.533Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (153, 28, 'points', 1.0, 0.0, '签到', '2026-02-04T08:58:35.537Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (154, 28, 'balance', -133.0, 0.0, '消费', '2026-01-16T08:58:35.539Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (155, 28, 'balance', -218.0, 0.0, '消费', '2026-01-30T08:58:35.543Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (156, 29, 'points', 16.0, 0.0, '消费赠送', '2026-02-01T08:58:35.552Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (157, 29, 'points', 67.0, 0.0, '消费赠送', '2026-01-21T08:58:35.555Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (158, 29, 'balance', 784.0, 0.0, '充值', '2026-01-14T08:58:35.559Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (159, 29, 'points', 20.0, 0.0, '签到', '2026-02-10T08:58:35.562Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (160, 29, 'points', 76.0, 0.0, '签到', '2026-01-12T08:58:35.565Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (161, 30, 'points', 78.0, 0.0, '活动奖励', '2026-01-13T08:58:35.573Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (162, 30, 'points', 79.0, 0.0, '活动奖励', '2026-01-24T08:58:35.576Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (163, 30, 'points', 87.0, 0.0, '消费赠送', '2026-02-07T08:58:35.579Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (164, 30, 'points', 46.0, 0.0, '消费赠送', '2026-02-06T08:58:35.582Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (165, 30, 'balance', 392.0, 0.0, '充值', '2026-02-07T08:58:35.586Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (166, 30, 'balance', -489.0, 0.0, '消费', '2026-02-08T08:58:35.589Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (167, 30, 'balance', 342.0, 0.0, '充值', '2026-02-05T08:58:35.592Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (168, 31, 'balance', -210.0, 0.0, '消费', '2026-02-01T08:58:35.601Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (169, 31, 'points', 92.0, 0.0, '消费赠送', '2026-01-16T08:58:35.604Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (170, 31, 'points', 64.0, 0.0, '活动奖励', '2026-01-12T08:58:35.607Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (171, 31, 'balance', -54.0, 0.0, '消费', '2026-01-26T08:58:35.610Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (172, 31, 'balance', -70.0, 0.0, '消费', '2026-02-03T08:58:35.614Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (173, 31, 'balance', 945.0, 0.0, '充值', '2026-01-22T08:58:35.616Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (174, 31, 'balance', -23.0, 0.0, '消费', '2026-01-14T08:58:35.620Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (175, 32, 'points', 7.0, 0.0, '签到', '2026-02-03T08:58:35.645Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (176, 32, 'points', 2.0, 0.0, '消费赠送', '2026-01-22T08:58:35.649Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (177, 32, 'points', -8.0, 0.0, '积分兑换', '2026-02-07T08:58:35.653Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (178, 32, 'balance', -124.0, 0.0, '消费', '2026-01-17T08:58:35.658Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (179, 32, 'points', 44.0, 0.0, '活动奖励', '2026-02-02T08:58:35.662Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (180, 32, 'balance', -317.0, 0.0, '消费', '2026-02-09T08:58:35.667Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (181, 32, 'balance', -268.0, 0.0, '消费', '2026-02-05T08:58:35.671Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (182, 32, 'balance', -355.0, 0.0, '消费', '2026-01-26T08:58:35.675Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (183, 32, 'balance', 252.0, 0.0, '充值', '2026-01-21T08:58:35.679Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (184, 32, 'balance', 978.0, 0.0, '充值', '2026-01-16T08:58:35.682Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (185, 33, 'points', 70.0, 0.0, '活动奖励', '2026-02-06T08:58:35.694Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (186, 33, 'points', 79.0, 0.0, '签到', '2026-02-09T08:58:35.698Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (187, 33, 'balance', -351.0, 0.0, '消费', '2026-01-23T08:58:35.701Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (188, 33, 'balance', -68.0, 0.0, '消费', '2026-01-18T08:58:35.704Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (189, 33, 'balance', -284.0, 0.0, '消费', '2026-02-09T08:58:35.707Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (190, 33, 'balance', 814.0, 0.0, '充值', '2026-01-19T08:58:35.710Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (191, 33, 'points', 0.0, 0.0, '签到', '2026-02-02T08:58:35.713Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (192, 33, 'balance', 997.0, 0.0, '充值', '2026-02-01T08:58:35.716Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (193, 33, 'balance', -456.0, 0.0, '消费', '2026-01-25T08:58:35.721Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (194, 33, 'points', 77.0, 0.0, '活动奖励', '2026-01-23T08:58:35.727Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (195, 34, 'points', -22.0, 0.0, '积分兑换', '2026-01-21T08:58:35.737Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (196, 34, 'points', -22.0, 0.0, '积分兑换', '2026-01-19T08:58:35.745Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (197, 34, 'points', -21.0, 0.0, '积分兑换', '2026-02-08T08:58:35.749Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (198, 34, 'balance', 736.0, 0.0, '充值', '2026-01-29T08:58:35.752Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (199, 34, 'points', 17.0, 0.0, '签到', '2026-01-14T08:58:35.755Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (200, 34, 'balance', 929.0, 0.0, '充值', '2026-01-14T08:58:35.758Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (201, 34, 'balance', -76.0, 0.0, '消费', '2026-01-23T08:58:35.765Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (202, 34, 'points', 0.0, 0.0, '积分兑换', '2026-01-17T08:58:35.771Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (203, 34, 'balance', 686.0, 0.0, '充值', '2026-01-17T08:58:35.777Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (204, 35, 'points', 26.0, 0.0, '消费赠送', '2026-01-31T08:58:35.794Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (205, 35, 'points', -14.0, 0.0, '积分兑换', '2026-01-22T08:58:35.799Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (206, 35, 'points', 69.0, 0.0, '签到', '2026-01-28T08:58:35.803Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (207, 35, 'points', -17.0, 0.0, '积分兑换', '2026-02-02T08:58:35.807Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (208, 35, 'points', 72.0, 0.0, '签到', '2026-01-29T08:58:35.811Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (209, 35, 'balance', 584.0, 0.0, '充值', '2026-01-27T08:58:35.815Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (210, 36, 'points', 94.0, 0.0, '消费赠送', '2026-01-17T08:58:35.828Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (211, 36, 'points', -43.0, 0.0, '积分兑换', '2026-02-01T08:58:35.835Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (212, 36, 'points', 0.0, 0.0, '积分兑换', '2026-02-01T08:58:35.850Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (213, 36, 'points', 61.0, 0.0, '消费赠送', '2026-02-02T08:58:35.857Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (214, 37, 'points', -40.0, 0.0, '积分兑换', '2026-01-31T08:58:35.868Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (215, 37, 'balance', -24.0, 0.0, '消费', '2026-01-20T08:58:35.872Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (216, 37, 'points', -44.0, 0.0, '积分兑换', '2026-02-08T08:58:35.876Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (217, 37, 'balance', 746.0, 0.0, '充值', '2026-01-16T08:58:35.881Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (218, 37, 'balance', -90.0, 0.0, '消费', '2026-01-13T08:58:35.890Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (219, 37, 'points', -34.0, 0.0, '积分兑换', '2026-01-16T08:58:35.899Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (220, 37, 'balance', 813.0, 0.0, '充值', '2026-01-22T08:58:35.909Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (221, 37, 'balance', -471.0, 0.0, '消费', '2026-02-05T08:58:35.916Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (222, 37, 'balance', 391.0, 0.0, '充值', '2026-01-17T08:58:35.923Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (223, 38, 'points', 65.0, 0.0, '签到', '2026-01-23T08:58:35.937Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (224, 38, 'balance', 799.0, 0.0, '充值', '2026-01-22T08:58:35.941Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (225, 39, 'balance', 156.0, 0.0, '充值', '2026-01-28T08:58:35.952Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (226, 39, 'points', -6.0, 0.0, '积分兑换', '2026-02-08T08:58:35.955Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (227, 39, 'balance', -215.0, 0.0, '消费', '2026-02-05T08:58:35.958Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (228, 39, 'points', 87.0, 0.0, '活动奖励', '2026-01-19T08:58:35.961Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (229, 39, 'points', 50.0, 0.0, '消费赠送', '2026-01-29T08:58:35.964Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (230, 39, 'points', 86.0, 0.0, '消费赠送', '2026-01-27T08:58:35.966Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (231, 39, 'balance', -240.0, 0.0, '消费', '2026-01-23T08:58:35.970Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (232, 39, 'points', 91.0, 0.0, '消费赠送', '2026-01-20T08:58:35.973Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (233, 39, 'balance', -305.0, 0.0, '消费', '2026-01-23T08:58:35.977Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (234, 40, 'points', 80.0, 0.0, '签到', '2026-01-12T08:58:35.988Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (235, 40, 'balance', 255.0, 0.0, '充值', '2026-01-23T08:58:35.992Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (236, 40, 'points', 29.0, 0.0, '消费赠送', '2026-02-08T08:58:36.009Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (237, 40, 'balance', 487.0, 0.0, '充值', '2026-02-04T08:58:36.017Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (238, 40, 'balance', 677.0, 0.0, '充值', '2026-01-20T08:58:36.022Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (239, 40, 'balance', 107.0, 0.0, '充值', '2026-01-12T08:58:36.031Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (240, 40, 'balance', -46.0, 0.0, '消费', '2026-02-03T08:58:36.035Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (241, 40, 'balance', -409.0, 0.0, '消费', '2026-01-23T08:58:36.040Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (242, 40, 'balance', -358.0, 0.0, '消费', '2026-01-28T08:58:36.047Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (243, 41, 'points', 97.0, 0.0, '活动奖励', '2026-02-08T08:58:36.059Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (244, 41, 'balance', -99.0, 0.0, '消费', '2026-01-17T08:58:36.062Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (245, 41, 'balance', -318.0, 0.0, '消费', '2026-01-31T08:58:36.068Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (246, 42, 'balance', 415.0, 0.0, '充值', '2026-01-13T08:58:36.099Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (247, 42, 'points', 66.0, 0.0, '签到', '2026-01-27T08:58:36.116Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (248, 42, 'balance', -116.0, 0.0, '消费', '2026-02-07T08:58:36.154Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (249, 42, 'points', -10.0, 0.0, '积分兑换', '2026-02-07T08:58:36.163Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (250, 42, 'points', 40.0, 0.0, '签到', '2026-02-08T08:58:36.172Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (251, 42, 'balance', -141.0, 0.0, '消费', '2026-01-18T08:58:36.181Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (252, 42, 'points', 27.0, 0.0, '消费赠送', '2026-01-15T08:58:36.189Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (253, 42, 'points', -33.0, 0.0, '积分兑换', '2026-02-10T08:58:36.208Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (254, 42, 'balance', -451.0, 0.0, '消费', '2026-02-08T08:58:36.214Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (255, 43, 'balance', -267.0, 0.0, '消费', '2026-01-18T08:58:36.229Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (256, 43, 'points', -24.0, 0.0, '积分兑换', '2026-01-28T08:58:36.235Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (257, 43, 'points', 33.0, 0.0, '消费赠送', '2026-01-24T08:58:36.249Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (258, 43, 'balance', -87.0, 0.0, '消费', '2026-01-13T08:58:36.256Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (259, 43, 'balance', 355.0, 0.0, '充值', '2026-01-18T08:58:36.264Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (260, 43, 'points', -8.0, 0.0, '积分兑换', '2026-01-15T08:58:36.274Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (261, 43, 'balance', -16.0, 0.0, '消费', '2026-01-24T08:58:36.299Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (262, 43, 'points', -9.0, 0.0, '积分兑换', '2026-01-21T08:58:36.309Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (263, 44, 'points', -49.0, 0.0, '积分兑换', '2026-02-04T08:58:36.349Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (264, 44, 'balance', -52.0, 0.0, '消费', '2026-02-06T08:58:36.358Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (265, 44, 'points', 70.0, 0.0, '消费赠送', '2026-02-08T08:58:36.370Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (266, 44, 'balance', -390.0, 0.0, '消费', '2026-02-05T08:58:36.377Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (267, 44, 'balance', -248.0, 0.0, '消费', '2026-01-20T08:58:36.382Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (268, 44, 'balance', -53.0, 0.0, '消费', '2026-01-21T08:58:36.389Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (269, 45, 'balance', -355.0, 0.0, '消费', '2026-01-20T08:58:36.399Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (270, 46, 'points', -48.0, 0.0, '积分兑换', '2026-02-03T08:58:36.410Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (271, 46, 'balance', -153.0, 0.0, '消费', '2026-01-25T08:58:36.412Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (272, 46, 'balance', 356.0, 0.0, '充值', '2026-01-16T08:58:36.415Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (273, 46, 'balance', -174.0, 0.0, '消费', '2026-01-23T08:58:36.420Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (274, 47, 'points', 97.0, 0.0, '签到', '2026-02-06T08:58:36.429Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (275, 47, 'points', 87.0, 0.0, '活动奖励', '2026-01-20T08:58:36.432Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (276, 48, 'points', 6.0, 0.0, '活动奖励', '2026-01-20T08:58:36.442Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (277, 48, 'balance', -48.0, 0.0, '消费', '2026-01-13T08:58:36.445Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (278, 48, 'points', 4.0, 0.0, '签到', '2026-02-10T08:58:36.455Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (279, 48, 'points', 9.0, 0.0, '消费赠送', '2026-01-26T08:58:36.460Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (280, 48, 'points', -35.0, 0.0, '积分兑换', '2026-01-31T08:58:36.463Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (281, 48, 'balance', -470.0, 0.0, '消费', '2026-01-30T08:58:36.467Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (282, 48, 'balance', 471.0, 0.0, '充值', '2026-02-06T08:58:36.474Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (283, 48, 'points', 49.0, 0.0, '签到', '2026-01-27T08:58:36.480Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (284, 49, 'balance', -274.0, 0.0, '消费', '2026-01-20T08:58:36.494Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (285, 49, 'balance', 275.0, 0.0, '充值', '2026-01-12T08:58:36.497Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (286, 50, 'balance', 247.0, 0.0, '充值', '2026-02-09T08:58:36.515Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (287, 50, 'points', -3.0, 0.0, '积分兑换', '2026-01-24T08:58:36.520Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (288, 50, 'balance', 669.0, 0.0, '充值', '2026-01-21T08:58:36.523Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (289, 50, 'balance', -498.0, 0.0, '消费', '2026-01-16T08:58:36.527Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (290, 50, 'points', 77.0, 0.0, '签到', '2026-01-17T08:58:36.530Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (291, 51, 'points', 0.0, 0.0, '积分兑换', '2026-02-02T08:58:36.540Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (292, 51, 'points', 62.0, 0.0, '消费赠送', '2026-01-21T08:58:36.543Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (293, 51, 'balance', -464.0, 0.0, '消费', '2026-01-12T08:58:36.546Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (294, 51, 'balance', -100.0, 0.0, '消费', '2026-02-03T08:58:36.549Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (295, 51, 'balance', -96.0, 0.0, '消费', '2026-01-21T08:58:36.554Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (296, 51, 'points', 5.0, 0.0, '消费赠送', '2026-02-10T08:58:36.558Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (297, 51, 'balance', 537.0, 0.0, '充值', '2026-01-16T08:58:36.562Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (298, 52, 'balance', -273.0, 0.0, '消费', '2026-01-22T08:58:36.588Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (299, 52, 'points', 93.0, 0.0, '活动奖励', '2026-01-14T08:58:36.591Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (300, 52, 'balance', 423.0, 0.0, '充值', '2026-02-04T08:58:36.595Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (301, 52, 'points', 12.0, 0.0, '活动奖励', '2026-02-09T08:58:36.598Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (302, 52, 'points', -21.0, 0.0, '积分兑换', '2026-02-10T08:58:36.601Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (303, 52, 'points', 91.0, 0.0, '活动奖励', '2026-01-22T08:58:36.604Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (304, 52, 'balance', -62.0, 0.0, '消费', '2026-01-18T08:58:36.610Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (305, 52, 'balance', 39.0, 0.0, '充值', '2026-02-06T08:58:36.613Z');
INSERT INTO "transactions" ("id", "member_id", "type", "amount", "balance_after", "remark", "created_at") VALUES (306, 52, 'points', 28.0, 0.0, '活动奖励', '2026-01-30T08:58:36.616Z');
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "users";
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL, -- 用户昵称
    password_hash TEXT NOT NULL, -- 存储加密后的密码
    avatar TEXT, -- 用户头像URL
    status INTEGER DEFAULT 1, -- 1:正常 0:禁用
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER DEFAULT 0, -- 自注册用户默认0
    updated_by INTEGER DEFAULT 0
);

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO "users" ("id", "username", "password_hash", "avatar", "status", "created_at", "updated_at", "created_by", "updated_by") VALUES (1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', NULL, 1, '2026-02-10 07:51:01', '2026-02-10 07:51:01', 0, 0);
COMMIT;

-- ----------------------------
-- Auto increment value for members
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 52 WHERE name = 'members';

-- ----------------------------
-- Auto increment value for transactions
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 306 WHERE name = 'transactions';

-- ----------------------------
-- Auto increment value for users
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 1 WHERE name = 'users';

PRAGMA foreign_keys = true;
