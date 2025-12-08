# Quick Bom - Advanced Construction Project Management Platform

**Quick Bom** is a comprehensive, enterprise-grade construction project management platform built with Next.js 14, featuring advanced Gantt chart visualization, project timeline management, resource allocation, and robust analytics for construction projects.

## 🚀 Key Features

### 🏗️ Construction Project Management
- **Advanced Gantt Chart** with interactive timeline visualization
- **Project Timeline Management** with task dependencies and milestones
- **Resource Allocation** with workforce and equipment tracking
- **Progress Tracking** with real-time updates and completion metrics
- **Budget Management** with cost estimation and expense tracking

### 📊 Dashboard & Analytics
- **Real-time Dashboards** with project overview and KPI metrics
- **Advanced Analytics** with project performance reports and historical data
- **Cost Monitoring** with budget vs actual expenditure analysis
- **Progress Analytics** with completion rates and timeline forecasting
- **Resource Utilization** with workforce and equipment efficiency metrics

### 🔧 Task & Milestone Management
- **Task Management** with detailed task breakdown and assignments
- **Milestone Tracking** with critical path identification
- **Dependency Mapping** with predecessor/successor relationships
- **Progress Updates** with completion percentage and status tracking
- **Quality Control** with inspection checklists and compliance tracking

### 🚨 Monitoring & Notifications
- **Project Alerts** with customizable thresholds and notifications
- **Deadline Tracking** with automated reminders and escalations
- **Risk Management** with issue tracking and mitigation planning
- **Communication Hub** with team collaboration and document sharing
- **Reporting System** with automated project status reports

### 🗺️ Site & Location Management
- **Site Location Mapping** with GPS coordinate tracking
- **Construction Site Management** with area planning and zoning
- **Supplier Management** with vendor coordination and material tracking
- **Subcontractor Coordination** with schedule alignment and progress monitoring
- **Safety Management** with incident tracking and compliance reporting

### 📋 Documentation & Compliance
- **Document Management** with project plans, drawings, and specifications
- **Permit Tracking** with regulatory compliance and approval monitoring
- **Quality Assurance** with inspection reports and defect tracking
- **Contract Management** with agreement tracking and change orders
- **Audit Trail** with complete project history and change tracking

### ⚙️ Advanced Features
- **Interactive Gantt Chart** with drag-and-drop task scheduling
- **Resource Leveling** with workload balancing and optimization
- **Critical Path Analysis** with project bottleneck identification
- **Baseline Comparison** with planned vs actual progress analysis
- **Multi-Project Portfolio** with cross-project resource allocation

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with TimescaleDB for time-series data
- **ORM**: Prisma with optimized schema and indexing
- **Real-time Communication**: MQTT, WebSockets (Paho MQTT)
- **Charts & Visualization**: ECharts, Recharts, Three.js with Troika Text
- **Authentication**: JWT with custom authentication middleware
- **UI Components**: Radix UI, Lucide Icons, Framer Motion
- **Mapping**: Leaflet integration
- **Security**: bcrypt, JWT, RBAC implementation

## 💾 Backup Management System

QuickBom includes a comprehensive automated backup system for critical business data:

### 🔄 Automatic Backup Features
- **Daily Automated Backups** - Scheduled backups at 2:00 AM daily
- **Data Retention Policy** - Automatic cleanup of backups older than 7 days
- **Comprehensive Coverage** - Backs up materials, assemblies, and templates data
- **Real-time Monitoring** - Track backup status and scheduler health

### 📊 Backup Management
- **Web Interface** - Access backup management through `/backups` in the dashboard
- **Manual Operations** - Create backups on-demand and trigger cleanup
- **Restore Functionality** - Restore data from any backup point
- **Statistics Dashboard** - Monitor backup success rates and storage usage

### 🛠️ Backup Scripts
```bash
# Create a backup manually
npm run backup:create

# Run cleanup to remove old backups
npm run backup:cleanup

# Start backup scheduler (for development)
npm run backup:start

# Stop backup scheduler
npm run backup:stop
```

### 🔧 Configuration
- **Auto-start**: Scheduler automatically starts in production, or set `BACKUP_SCHEDULER_ALWAYS_ON=true` for development
- **Timezone**: Backups run in Asia/Jakarta timezone
- **Storage**: Backups stored in `backups/` directory as JSON files
- **Retention**: Configured for 7-day retention (customizable in code)

### 🧪 Testing
```bash
# Run comprehensive backup system test
npm run backup:test
```

### 📋 Backup Contents
Each backup includes:
- Complete materials catalog with specifications
- Assembly definitions with material relationships
- Template configurations and compositions
- Metadata with timestamps and version information

**Note**: Projects and user data are not included in automated backups to maintain system integrity.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL with TimescaleDB extension
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GSPETech/QuickBom-WebApps.git
   cd quickbom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Setup PostgreSQL with TimescaleDB
   ./infrastructure/scripts/setup/setup-postgresql-timescaledb.sh

   # Run database migrations
   npm run db:migrate
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

5. **Seed the database**
   ```bash
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the dashboard.

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   npm start
   ```

2. **Environment Setup**
   - Configure production `.env` with database and MQTT broker settings
   - Set up reverse proxy (nginx recommended)
   - Configure SSL certificates

3. **Database Permissions**
   ```bash
   ./fix-db-permissions.sh
   ```

## 📖 Documentation

### Key Directories
- `app/` - Main application pages and API routes (Next.js App Router)
- `components/` - Reusable React components (organized by feature)
- `lib/` - Core utilities, services, types, and business logic
- `prisma/` - Database schema and migrations
- `middleware/` - Next.js middleware and device protocols
- `infrastructure/` - Docker, deployment scripts, and infrastructure tools
- `docs/` - Project documentation, guides, and specifications
- `scripts/` - Database seeding and utility scripts
- `public/` - Static assets and media files

### RBAC Implementation
The system implements comprehensive RBAC with 74 permissions across:
- Dashboard Management
- Device Management
- Network Configuration
- User Administration
- System Maintenance
- Analytics and Reporting

See `RBAC_IMPLEMENTATION_README.md` for detailed implementation guide.

### API Reference
All API endpoints are documented in respective route files under `app/api/`.

## 🔧 Available Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "db:seed": "npm run seed:init"
}
```

### Database Seeding Scripts
```bash
npm run seed:users          # Seed user accounts
npm run seed:menu          # Seed menu structure
npm run seed:dashboard     # Seed dashboard layouts
npm run seed:devices       # Seed device templates
npm run seed:tenants       # Seed tenant data
```

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   API Routes    │    │   Middleware    │
│  (Next.js)      │◄──►│   (REST/WS)     │◄──►│   (Protocols)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Authentication │    │   Database      │    │  MQTT Broker    │
│    (JWT/RBAC)   │    │  (PostgreSQL)   │    │   (Mosquitto)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema
- **Multi-tenant support** with tenant isolation
- **Time-series optimization** using TimescaleDB
- **RBAC permissions** with role-based access control
- **Device management** with MQTT integration
- **Logging and monitoring** with efficient indexing
- **Backup scheduling** with automated routines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is proprietary. All rights reserved.

## 📞 Support

For technical support or questions:
- Email: support@quickbom.com
- Documentation: [RBAC_IMPLEMENTATION_README.md](./RBAC_IMPLEMENTATION_README.md)

## 🚀 Roadmap

### Planned Features
- [ ] Enhanced AI-powered anomaly detection
- [ ] Advanced IoT protocol support expansion
- [ ] Mobile application development
- [ ] API rate limiting and advanced security
- [ ] Multi-cloud deployment support

---

**Built with ❤️ for modern construction project management**
