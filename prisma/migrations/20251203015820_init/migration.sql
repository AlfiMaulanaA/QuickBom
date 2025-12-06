-- CreateEnum
CREATE TYPE "AlarmType" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "AlarmKeyType" AS ENUM ('DIRECT', 'THRESHOLD', 'BIT_VALUE');

-- CreateEnum
CREATE TYPE "MaintenanceTarget" AS ENUM ('Device', 'Rack');

-- CreateEnum
CREATE TYPE "AlarmLogStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'CLEARED');

-- CreateEnum
CREATE TYPE "MqttProtocol" AS ENUM ('TCP', 'WEBSOCKET', 'SECURE_TCP', 'SECURE_WEBSOCKET');

-- CreateEnum
CREATE TYPE "MqttConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING', 'ERROR', 'BROKER_UNAVAILABLE');

-- CreateEnum
CREATE TYPE "MqttConnectionEvent" AS ENUM ('CONNECTED', 'DISCONNECTED', 'CONNECTION_FAILED', 'RECONNECTING', 'BROKER_UNAVAILABLE', 'AUTHENTICATION_FAILED');

-- CreateEnum
CREATE TYPE "MqttMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "fingerprintId" TEXT,
    "cardUid" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT,
    "currentMenuPresetId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeveloper" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "menuGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeveloper" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleMenuPermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleMenuPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTask" TIMESTAMP(3) NOT NULL,
    "endTask" TIMESTAMP(3) NOT NULL,
    "assignTo" TEXT NOT NULL,
    "targetType" "MaintenanceTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deviceTargetId" TEXT,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceExternal" (
    "id" TEXT NOT NULL,
    "uniqId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "address" TEXT,
    "rackId" TEXT,
    "positionU" INTEGER DEFAULT 0,
    "sizeU" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastPayload" JSONB,
    "lastUpdatedByMqtt" TIMESTAMP(3),

    CONSTRAINT "DeviceExternal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoggingConfiguration" (
    "id" TEXT NOT NULL,
    "customName" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "units" TEXT,
    "multiply" DOUBLE PRECISION DEFAULT 1,
    "deviceUniqId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoggedAt" TIMESTAMP(3),
    "loggingIntervalMinutes" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "LoggingConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoggedData" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoggedData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillConfiguration" (
    "id" TEXT NOT NULL,
    "customName" TEXT NOT NULL,
    "sourceDeviceKey" TEXT NOT NULL,
    "rupiahRatePerKwh" DOUBLE PRECISION NOT NULL DEFAULT 1467,
    "dollarRatePerKwh" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishTargetDeviceUniqId" TEXT NOT NULL,
    "sourceDeviceUniqId" TEXT NOT NULL,

    CONSTRAINT "BillConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillLog" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "rawValue" DOUBLE PRECISION NOT NULL,
    "rupiahCost" DOUBLE PRECISION NOT NULL,
    "dollarCost" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PueConfiguration" (
    "id" TEXT NOT NULL,
    "customName" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'pue',
    "apiTopicUniqId" TEXT,
    "pduList" JSONB,
    "mainPower" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PueConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PowerAnalyzerConfiguration" (
    "id" TEXT NOT NULL,
    "customName" TEXT NOT NULL,
    "apiTopicUniqId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mainPower" JSONB,
    "pduList" JSONB,

    CONSTRAINT "PowerAnalyzerConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuConfiguration" (
    "id" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlarmConfiguration" (
    "id" TEXT NOT NULL,
    "customName" TEXT NOT NULL,
    "alarmType" "AlarmType" NOT NULL,
    "keyType" "AlarmKeyType" NOT NULL,
    "key" TEXT NOT NULL,
    "deviceUniqId" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "maxOnly" BOOLEAN DEFAULT false,
    "directTriggerOnTrue" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlarmConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlarmBitConfiguration" (
    "id" TEXT NOT NULL,
    "alarmConfigId" TEXT NOT NULL,
    "bitPosition" INTEGER NOT NULL,
    "customName" TEXT NOT NULL,
    "alertToWhatsApp" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AlarmBitConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlarmNotificationRecipient" (
    "id" TEXT NOT NULL,
    "alarmConfigId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sendWhatsApp" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlarmNotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlarmLog" (
    "id" TEXT NOT NULL,
    "status" "AlarmLogStatus" NOT NULL,
    "triggeringValue" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),
    "alarmConfigId" TEXT NOT NULL,

    CONSTRAINT "AlarmLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zigbee_devices" (
    "id" TEXT NOT NULL,
    "zigbee_device_id" TEXT NOT NULL,
    "friendlyName" TEXT,
    "description" TEXT,
    "deviceType" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3),
    "capabilities" JSONB,
    "currentState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zigbee_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cctv" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "channel" TEXT,
    "username" TEXT,
    "password" TEXT,
    "resolution" TEXT DEFAULT '640x480',
    "framerate" INTEGER DEFAULT 15,
    "bitrate" INTEGER DEFAULT 1024,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "group" TEXT,
    "apiKey" TEXT,

    CONSTRAINT "Cctv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardLayout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inUse" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "DashboardLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScadaLayout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inUse" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "ScadaLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container3dWidgetConfig" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "customName" TEXT NOT NULL,
    "totalRack" INTEGER NOT NULL DEFAULT 11,
    "coolingRacks" JSONB,
    "frontTopics" JSONB,
    "backTopics" JSONB,
    "powerTopic" TEXT,
    "gridX" INTEGER NOT NULL DEFAULT 0,
    "gridY" INTEGER NOT NULL DEFAULT 0,
    "gridWidth" INTEGER NOT NULL DEFAULT 4,
    "gridHeight" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Container3dWidgetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerRack" (
    "id" TEXT NOT NULL,
    "container3dWidgetConfigId" TEXT NOT NULL,
    "rackNumber" INTEGER NOT NULL,
    "servers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContainerRack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyTarget" (
    "id" TEXT NOT NULL,
    "loggingConfigId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "monthlyTargets" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnergyTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessController" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "lockCount" INTEGER NOT NULL DEFAULT 0,
    "firmware" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "doorStatus" TEXT,
    "lockAddresses" TEXT,
    "lastSeen" TIMESTAMP(3),
    "macAddress" TEXT,
    "freeHeap" INTEGER,
    "logFileSize" INTEGER,
    "spiffsTotal" INTEGER,
    "spiffsUsed" INTEGER,
    "totalHeap" INTEGER,
    "uptime" TEXT,

    CONSTRAINT "AccessController_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "controllerId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoraDevice" (
    "id" TEXT NOT NULL,
    "devEui" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastSeen" TIMESTAMP(3),

    CONSTRAINT "LoraDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceData" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "DeviceData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoraGateway" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lastSeen" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoraGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayStats" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "rfPacketsReceived" INTEGER NOT NULL DEFAULT 0,
    "rfPacketsOk" INTEGER NOT NULL DEFAULT 0,
    "rfPacketsBad" INTEGER NOT NULL DEFAULT 0,
    "rfPacketsNocrc" INTEGER NOT NULL DEFAULT 0,
    "rfPacketsForwarded" INTEGER NOT NULL DEFAULT 0,
    "upstreamPayloadBytes" INTEGER NOT NULL DEFAULT 0,
    "upstreamDatagramsSent" INTEGER NOT NULL DEFAULT 0,
    "upstreamNetworkBytes" INTEGER NOT NULL DEFAULT 0,
    "upstreamAckRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "crcOkRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "crcFailRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "noCrcRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pullDataSent" INTEGER NOT NULL DEFAULT 0,
    "pullAckReceived" INTEGER NOT NULL DEFAULT 0,
    "downstreamDatagramsReceived" INTEGER NOT NULL DEFAULT 0,
    "downstreamNetworkBytes" INTEGER NOT NULL DEFAULT 0,
    "downstreamPayloadBytes" INTEGER NOT NULL DEFAULT 0,
    "txOk" INTEGER NOT NULL DEFAULT 0,
    "txErrors" INTEGER NOT NULL DEFAULT 0,
    "downstreamAckRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "counterInst" TEXT NOT NULL DEFAULT '0',
    "counterPps" TEXT NOT NULL DEFAULT '0',
    "beaconQueued" INTEGER NOT NULL DEFAULT 0,
    "beaconSent" INTEGER NOT NULL DEFAULT 0,
    "beaconRejected" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatewayStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThermalData" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minTemp" DOUBLE PRECISION,
    "maxTemp" DOUBLE PRECISION,
    "avgTemp" DOUBLE PRECISION,
    "frameCount" INTEGER,

    CONSTRAINT "ThermalData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeTenantDashboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isUse" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NodeTenantDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeTenantLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "url" TEXT,
    "topic" TEXT,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "nodeType" TEXT NOT NULL DEFAULT 'node',
    "tenantId" TEXT,
    "dashboardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NodeTenantLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeLocationMqttPayload" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT,

    CONSTRAINT "NodeLocationMqttPayload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacityU" INTEGER NOT NULL DEFAULT 42,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Layout2D" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isUse" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Layout2D_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Layout2DDataPoint" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "deviceUniqId" TEXT NOT NULL,
    "selectedKey" TEXT,
    "selectedKeys" TEXT,
    "units" TEXT,
    "multiply" DOUBLE PRECISION DEFAULT 1,
    "customName" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "fontSize" INTEGER DEFAULT 14,
    "color" TEXT DEFAULT '#000000',
    "iconName" TEXT,
    "iconColor" TEXT DEFAULT '#666666',
    "showIcon" BOOLEAN DEFAULT false,
    "displayLayout" TEXT DEFAULT 'vertical',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Layout2DDataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Layout2DFlowIndicator" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "deviceUniqId" TEXT NOT NULL,
    "selectedKey" TEXT NOT NULL,
    "customName" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "arrowDirection" TEXT NOT NULL DEFAULT 'right',
    "logicOperator" TEXT NOT NULL,
    "compareValue" TEXT NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'number',
    "trueColor" TEXT NOT NULL DEFAULT '#22c55e',
    "trueAnimation" BOOLEAN NOT NULL DEFAULT true,
    "falseColor" TEXT NOT NULL DEFAULT '#ef4444',
    "falseAnimation" BOOLEAN NOT NULL DEFAULT false,
    "warningColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "warningAnimation" BOOLEAN NOT NULL DEFAULT true,
    "warningEnabled" BOOLEAN NOT NULL DEFAULT false,
    "warningOperator" TEXT,
    "warningValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Layout2DFlowIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfiguration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT 'Menu',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuPresetGroup" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "MenuPresetGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuPresetItem" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "MenuPresetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "daysOfWeek" TEXT,
    "daysOfMonth" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" TEXT NOT NULL,
    "nextRun" TIMESTAMP(3),
    "lastRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupScheduleExecution" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "error" TEXT,
    "result" TEXT,
    "logs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupScheduleExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModbusRTUConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "port" TEXT NOT NULL,
    "baudRate" INTEGER NOT NULL DEFAULT 9600,
    "dataBits" INTEGER NOT NULL DEFAULT 8,
    "parity" TEXT NOT NULL DEFAULT 'none',
    "stopBits" INTEGER NOT NULL DEFAULT 1,
    "timeout" INTEGER NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModbusRTUConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MqttConfiguration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brokerHost" TEXT NOT NULL DEFAULT '18.143.215.113',
    "brokerPort" INTEGER NOT NULL DEFAULT 9000,
    "protocol" "MqttProtocol" NOT NULL DEFAULT 'WEBSOCKET',
    "useSSL" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "username" TEXT,
    "password" TEXT,
    "useAuthentication" BOOLEAN NOT NULL DEFAULT false,
    "keepAlive" INTEGER NOT NULL DEFAULT 60,
    "connectTimeout" INTEGER NOT NULL DEFAULT 10000,
    "reconnectPeriod" INTEGER NOT NULL DEFAULT 5000,
    "cleanSession" BOOLEAN NOT NULL DEFAULT true,
    "maxReconnectAttempts" INTEGER NOT NULL DEFAULT 10,
    "defaultQos" INTEGER NOT NULL DEFAULT 1,
    "retainMessages" BOOLEAN NOT NULL DEFAULT true,
    "willTopic" TEXT,
    "willMessage" TEXT,
    "willQos" INTEGER NOT NULL DEFAULT 1,
    "willRetain" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "connectionStatus" "MqttConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "lastConnectedAt" TIMESTAMP(3),
    "lastDisconnectedAt" TIMESTAMP(3),
    "connectionError" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "bytesSent" INTEGER NOT NULL DEFAULT 0,
    "bytesReceived" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "MqttConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MqttConnectionHistory" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "eventType" "MqttConnectionEvent" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "errorMessage" TEXT,
    "duration" INTEGER,

    CONSTRAINT "MqttConnectionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MqttTopicSubscription" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "qos" INTEGER NOT NULL DEFAULT 1,
    "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3),
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MqttTopicSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MqttMessageLog" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "qos" INTEGER NOT NULL,
    "retained" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direction" "MqttMessageDirection" NOT NULL,

    CONSTRAINT "MqttMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RolePermissions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_fingerprintId_key" ON "User"("fingerprintId");

-- CreateIndex
CREATE UNIQUE INDEX "User_cardUid_key" ON "User"("cardUid");

-- CreateIndex
CREATE INDEX "User_email_roleId_idx" ON "User"("email", "roleId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_resource_action_idx" ON "Permission"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "MenuGroup_name_key" ON "MenuGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_name_key" ON "MenuItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RoleMenuPermission_roleId_menuItemId_key" ON "RoleMenuPermission"("roleId", "menuItemId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_permissionId_idx" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceExternal_uniqId_key" ON "DeviceExternal"("uniqId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceExternal_topic_key" ON "DeviceExternal"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "LoggingConfiguration_deviceUniqId_key_key" ON "LoggingConfiguration"("deviceUniqId", "key");

-- CreateIndex
CREATE INDEX "LoggedData_configId_timestamp_idx" ON "LoggedData"("configId", "timestamp");

-- CreateIndex
CREATE INDEX "LoggedData_timestamp_idx" ON "LoggedData"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "BillConfiguration_customName_key" ON "BillConfiguration"("customName");

-- CreateIndex
CREATE UNIQUE INDEX "BillConfiguration_publishTargetDeviceUniqId_key" ON "BillConfiguration"("publishTargetDeviceUniqId");

-- CreateIndex
CREATE UNIQUE INDEX "PueConfiguration_customName_key" ON "PueConfiguration"("customName");

-- CreateIndex
CREATE UNIQUE INDEX "PueConfiguration_apiTopicUniqId_key" ON "PueConfiguration"("apiTopicUniqId");

-- CreateIndex
CREATE UNIQUE INDEX "PowerAnalyzerConfiguration_customName_key" ON "PowerAnalyzerConfiguration"("customName");

-- CreateIndex
CREATE UNIQUE INDEX "PowerAnalyzerConfiguration_apiTopicUniqId_key" ON "PowerAnalyzerConfiguration"("apiTopicUniqId");

-- CreateIndex
CREATE UNIQUE INDEX "AlarmNotificationRecipient_alarmConfigId_userId_key" ON "AlarmNotificationRecipient"("alarmConfigId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "zigbee_devices_zigbee_device_id_key" ON "zigbee_devices"("zigbee_device_id");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardLayout_userId_name_key" ON "DashboardLayout"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ScadaLayout_userId_name_key" ON "ScadaLayout"("userId", "name");

-- CreateIndex
CREATE INDEX "Container3dWidgetConfig_layoutId_idx" ON "Container3dWidgetConfig"("layoutId");

-- CreateIndex
CREATE INDEX "ContainerRack_container3dWidgetConfigId_idx" ON "ContainerRack"("container3dWidgetConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "ContainerRack_container3dWidgetConfigId_rackNumber_key" ON "ContainerRack"("container3dWidgetConfigId", "rackNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EnergyTarget_loggingConfigId_key" ON "EnergyTarget"("loggingConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "EnergyTarget_loggingConfigId_year_key" ON "EnergyTarget"("loggingConfigId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "AccessController_ipAddress_key" ON "AccessController"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "AccessController_macAddress_key" ON "AccessController"("macAddress");

-- CreateIndex
CREATE UNIQUE INDEX "LoraDevice_devEui_key" ON "LoraDevice"("devEui");

-- CreateIndex
CREATE UNIQUE INDEX "LoraGateway_gatewayId_key" ON "LoraGateway"("gatewayId");

-- CreateIndex
CREATE INDEX "ThermalData_deviceId_timestamp_idx" ON "ThermalData"("deviceId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "Tenant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_email_key" ON "Tenant"("email");

-- CreateIndex
CREATE INDEX "NodeTenantDashboard_userId_isActive_idx" ON "NodeTenantDashboard"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NodeTenantDashboard_userId_name_key" ON "NodeTenantDashboard"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "NodeTenantLocation_name_key" ON "NodeTenantLocation"("name");

-- CreateIndex
CREATE INDEX "NodeLocationMqttPayload_locationId_receivedAt_idx" ON "NodeLocationMqttPayload"("locationId", "receivedAt");

-- CreateIndex
CREATE INDEX "NodeLocationMqttPayload_topic_idx" ON "NodeLocationMqttPayload"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "Rack_name_key" ON "Rack"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Layout2D_name_key" ON "Layout2D"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Layout2DDataPoint_layoutId_deviceUniqId_customName_key" ON "Layout2DDataPoint"("layoutId", "deviceUniqId", "customName");

-- CreateIndex
CREATE UNIQUE INDEX "Layout2DFlowIndicator_layoutId_deviceUniqId_selectedKey_pos_key" ON "Layout2DFlowIndicator"("layoutId", "deviceUniqId", "selectedKey", "positionX", "positionY");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfiguration_key_key" ON "SystemConfiguration"("key");

-- CreateIndex
CREATE INDEX "MenuPreset_userId_isActive_idx" ON "MenuPreset"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MenuPreset_userId_name_key" ON "MenuPreset"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MenuPresetGroup_presetId_groupId_key" ON "MenuPresetGroup"("presetId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuPresetItem_presetId_itemId_key" ON "MenuPresetItem"("presetId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ModbusRTUConfig_port_key" ON "ModbusRTUConfig"("port");

-- CreateIndex
CREATE UNIQUE INDEX "MqttConfiguration_name_key" ON "MqttConfiguration"("name");

-- CreateIndex
CREATE INDEX "MqttConnectionHistory_configId_timestamp_idx" ON "MqttConnectionHistory"("configId", "timestamp");

-- CreateIndex
CREATE INDEX "MqttTopicSubscription_configId_idx" ON "MqttTopicSubscription"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "MqttTopicSubscription_configId_topic_key" ON "MqttTopicSubscription"("configId", "topic");

-- CreateIndex
CREATE INDEX "MqttMessageLog_configId_timestamp_idx" ON "MqttMessageLog"("configId", "timestamp");

-- CreateIndex
CREATE INDEX "MqttMessageLog_topic_timestamp_idx" ON "MqttMessageLog"("topic", "timestamp");

-- CreateIndex
CREATE INDEX "_RolePermissions_B_index" ON "_RolePermissions"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuGroupId_fkey" FOREIGN KEY ("menuGroupId") REFERENCES "MenuGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenuPermission" ADD CONSTRAINT "RoleMenuPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenuPermission" ADD CONSTRAINT "RoleMenuPermission_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_assignTo_fkey" FOREIGN KEY ("assignTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_deviceTargetId_fkey" FOREIGN KEY ("deviceTargetId") REFERENCES "DeviceExternal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceExternal" ADD CONSTRAINT "DeviceExternal_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoggingConfiguration" ADD CONSTRAINT "LoggingConfiguration_deviceUniqId_fkey" FOREIGN KEY ("deviceUniqId") REFERENCES "DeviceExternal"("uniqId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoggedData" ADD CONSTRAINT "LoggedData_configId_fkey" FOREIGN KEY ("configId") REFERENCES "LoggingConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillConfiguration" ADD CONSTRAINT "BillConfiguration_publishTargetDeviceUniqId_fkey" FOREIGN KEY ("publishTargetDeviceUniqId") REFERENCES "DeviceExternal"("uniqId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillConfiguration" ADD CONSTRAINT "BillConfiguration_sourceDeviceUniqId_fkey" FOREIGN KEY ("sourceDeviceUniqId") REFERENCES "DeviceExternal"("uniqId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillLog" ADD CONSTRAINT "BillLog_configId_fkey" FOREIGN KEY ("configId") REFERENCES "BillConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PueConfiguration" ADD CONSTRAINT "PueConfiguration_apiTopicUniqId_fkey" FOREIGN KEY ("apiTopicUniqId") REFERENCES "DeviceExternal"("uniqId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PowerAnalyzerConfiguration" ADD CONSTRAINT "PowerAnalyzerConfiguration_apiTopicUniqId_fkey" FOREIGN KEY ("apiTopicUniqId") REFERENCES "DeviceExternal"("uniqId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlarmConfiguration" ADD CONSTRAINT "AlarmConfiguration_deviceUniqId_fkey" FOREIGN KEY ("deviceUniqId") REFERENCES "DeviceExternal"("uniqId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlarmBitConfiguration" ADD CONSTRAINT "AlarmBitConfiguration_alarmConfigId_fkey" FOREIGN KEY ("alarmConfigId") REFERENCES "AlarmConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlarmNotificationRecipient" ADD CONSTRAINT "AlarmNotificationRecipient_alarmConfigId_fkey" FOREIGN KEY ("alarmConfigId") REFERENCES "AlarmConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlarmNotificationRecipient" ADD CONSTRAINT "AlarmNotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlarmLog" ADD CONSTRAINT "AlarmLog_alarmConfigId_fkey" FOREIGN KEY ("alarmConfigId") REFERENCES "AlarmConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardLayout" ADD CONSTRAINT "DashboardLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScadaLayout" ADD CONSTRAINT "ScadaLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container3dWidgetConfig" ADD CONSTRAINT "Container3dWidgetConfig_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "DashboardLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerRack" ADD CONSTRAINT "ContainerRack_container3dWidgetConfigId_fkey" FOREIGN KEY ("container3dWidgetConfigId") REFERENCES "Container3dWidgetConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_controllerId_fkey" FOREIGN KEY ("controllerId") REFERENCES "AccessController"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceData" ADD CONSTRAINT "DeviceData_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "LoraDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatewayStats" ADD CONSTRAINT "GatewayStats_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "LoraGateway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThermalData" ADD CONSTRAINT "ThermalData_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "DeviceExternal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeTenantDashboard" ADD CONSTRAINT "NodeTenantDashboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeTenantLocation" ADD CONSTRAINT "NodeTenantLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeTenantLocation" ADD CONSTRAINT "NodeTenantLocation_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "NodeTenantDashboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeLocationMqttPayload" ADD CONSTRAINT "NodeLocationMqttPayload_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "NodeTenantLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Layout2DDataPoint" ADD CONSTRAINT "Layout2DDataPoint_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout2D"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Layout2DDataPoint" ADD CONSTRAINT "Layout2DDataPoint_deviceUniqId_fkey" FOREIGN KEY ("deviceUniqId") REFERENCES "DeviceExternal"("uniqId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Layout2DFlowIndicator" ADD CONSTRAINT "Layout2DFlowIndicator_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout2D"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Layout2DFlowIndicator" ADD CONSTRAINT "Layout2DFlowIndicator_deviceUniqId_fkey" FOREIGN KEY ("deviceUniqId") REFERENCES "DeviceExternal"("uniqId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPreset" ADD CONSTRAINT "MenuPreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPresetGroup" ADD CONSTRAINT "MenuPresetGroup_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "MenuPreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPresetItem" ADD CONSTRAINT "MenuPresetItem_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "MenuPreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupScheduleExecution" ADD CONSTRAINT "BackupScheduleExecution_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "BackupSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MqttConnectionHistory" ADD CONSTRAINT "MqttConnectionHistory_configId_fkey" FOREIGN KEY ("configId") REFERENCES "MqttConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MqttTopicSubscription" ADD CONSTRAINT "MqttTopicSubscription_configId_fkey" FOREIGN KEY ("configId") REFERENCES "MqttConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MqttMessageLog" ADD CONSTRAINT "MqttMessageLog_configId_fkey" FOREIGN KEY ("configId") REFERENCES "MqttConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
