## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.# Ping Pilot 🚀

A server monitoring system that allows users to check and track multiple website/server availability with customizable schedules, notifications, and subscription plans.

## Features

### Core Functionality
- **Server Status Monitoring**: Track if servers/websites are up or down using XMLHttpRequests
- **Real-time Dashboard**: View all your servers and their current status
- **Status Tracking**: Monitor current server status and response times
- **Customizable Monitoring**: Configure which days of the week and time frames to monitor
- **Custom Check Frequencies**: From 1-minute to hourly intervals

### User Features
- **Multi-Server Management**: Add multiple servers according to your subscription plan
- **Email Alerts**: Get notified when your servers go down or recover
- **Authentication**: Secure login/signup with email verification
- **Subscription Plans**: Free 2-day trial and premium plans for continued monitoring
- **Responsive Interface**: Works on desktop and mobile devices

### Advanced Features
- **Role-Based Access**: User and admin roles with different capabilities
- **Admin Panel**: Manage users and view all servers in the system
- **Customizable Notifications**: Control when and how you receive alerts

## Tech Stack

- **Frontend**: Next.js 15 with App Router and Turbopack
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Email Service**: Nodemailer
- **Deployment**: Vercel (recommended)

## Project Structure

```
ping-pilot/
├── app/                    # Next.js 15 App Router
│   ├── api/                # API endpoints
│   │   ├── auth/           # Authentication routes
│   │   ├── servers/        # Server management routes
│   │   └── check-servers/  # Server checking endpoint
│   ├── admin/              # Admin dashboard pages
│   ├── auth/               # Authentication pages
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── servers/            # Server management pages
│   │   ├── [id]/           # Individual server details
│   │   └── new/            # Add new server page
│   ├── components/         # Client components
│   ├── layout.js           # Root layout
│   └── page.js             # Main dashboard page
├── components/             # Shared components
│   ├── auth/               # Auth-related components
│   ├── dashboard/          # Dashboard components
│   ├── server/             # Server-related components
│   └── ui/                 # Generic UI components
├── context/                # React context providers
├── firebase/               # Firebase configuration
├── services/               # Data services
├── utils/                  # Utility functions
│   ├── emailService.js     # Email sending with Nodemailer
│   └── serverChecker.js    # Server status checking logic
├── public/                 # Static files
├── .env.local              # Environment variables (not committed)
├── package.json            # Dependencies and scripts
└── next.config.mjs         # Next.js configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Firebase account
- SMTP email service (for sending notifications)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/ping-pilot.git
cd ping-pilot
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory and add the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Email Configuration (Nodemailer)
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email-user
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=notifications@your-domain.com

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Run the development server with Turbopack**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

### Setting Up Firebase

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication and Firestore Database
3. Set up Authentication with Email/Password provider
4. Create the necessary Firestore collections:
   - `users`
   - `servers`
   - `serverStatus`

### Creating an Admin Account

Admin accounts are created by directly modifying the user's role in Firestore:

1. Create a normal user account through the application
2. In Firebase Console, navigate to Firestore
3. Find the user document in the `users` collection
4. Edit the document and change the `role` field value to `"admin"`

## Deployment

### Deployment

The project is optimized for Vercel deployment, which supports Next.js 15 and the App Router out of the box.

1. Push your code to a GitHub repository
2. Sign up or log in to [Vercel](https://vercel.com)
3. Import your repository
4. Configure your environment variables
5. Deploy the application

Vercel will automatically detect your Next.js configuration and deploy your application with the optimal settings.

For the best performance, Vercel's serverless functions will handle your API routes, and the Edge Network will serve your static content with minimal latency.

### Setting Up Scheduled Checks

To run regular server checks, set up a scheduled job:

1. For Vercel deployment, create a Vercel Cron Job:
   - Add the following to your `vercel.json` file:
   ```json
   {
     "crons": [
       {
         "path": "/api/check-servers",
         "schedule": "* * * * *"
       }
     ]
   }
   ```

2. Alternatively, use an external service like UptimeRobot or cron-job.org to ping your API endpoints regularly.

## Subscription Plans

### Free Trial
- 2-day free trial per server
- Basic monitoring
- 5-minute check frequency
- Email alerts

### Monthly Plan - $8/month
- Unlimited monitoring duration
- Server limit based on plan
- 5-minute check frequency
- Email alerts

### Half-Yearly Plan - $45
- Unlimited monitoring duration
- Higher server limit
- 1-minute check frequency
- Priority email alerts
- Multiple alert recipients

### Yearly Plan - $85
- Unlimited monitoring duration
- Highest server limit
- Custom check frequency (down to 30 seconds)
- Advanced alert options
- Custom integration options

## Development

### Next.js 15 Features Used

- **App Router**: For advanced routing capabilities
- **Turbopack**: For faster development builds and HMR
- **Server Components**: For optimized rendering
- **Server Actions**: For handling form submissions
- **API Routes**: For backend functionality
- **Route Handlers**: For custom API endpoints
- **Middleware**: For authentication and route protection

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Ping Pilot Implementation Plan

Based on the provided flow diagram, here's a detailed implementation plan for the Ping Pilot application.

## 1. Pages to Implement

### Login Page (`app/page.js` or `app/login/page.js`)
- Authentication form with email/password
- Login functionality using Firebase Authentication
- Registration option for new users
- Reset password functionality
- Redirects to appropriate dashboard based on user role

### Server Upload Page (`app/servers/new/page.js`)
- Form for adding a new server URL
- Trial period information display
- Validation to check if user already has a server
- Pricing plan popup for additional servers
- WebApp component for server configuration

### All Servers Info Page (`app/dashboard/page.js`)
- Table listing all servers added by the user
- Columns for server name, URL, status, uptime percentage
- Column showing who uploaded each server
- Navigation to individual server monitoring page
- Filtering options for server status

### Individual Server Monitoring Page (`app/servers/[id]/page.js`)
- Detailed server status information
- Server dropdown for quick navigation between servers
- Response time and uptime statistics
- Configuration options for monitoring settings
- Email alert settings

## 2. Components to Build

### Authentication Components
- `<LoginForm />` - Email/password login form
- `<RegistrationForm />` - New user registration
- `<PasswordReset />` - Password recovery functionality

### Server Management Components
- `<ServerUploadForm />` - Form for adding a new server
- `<PricingPlanModal />` - Subscription options popup
- `<TrialWarning />` - Banner showing trial period status

### Dashboard Components
- `<ServersList />` - Table listing all servers
- `<ServerStatusBadge />` - Visual indicator for server status
- `<ServerDropdown />` - Navigation dropdown for all user servers

### Monitoring Components
- `<MonitoringSettings />` - Configuration form for server monitoring
- `<AlertSettings />` - Email notification configuration
- `<ServerStatusChart />` - Visual representation of uptime/response time
- `<ResponseTimeGraph />` - Historical chart of response times

## 3. Firebase Structure

### Authentication
- Use Firebase Authentication for user management
- Store user roles (user/admin) in Firestore

### Firestore Collections

#### `users` Collection
```
users/{userId}
{
  name: string,
  email: string,
  role: "user" | "admin",
  createdAt: timestamp,
  subscription: {
    plan: "free" | "monthly" | "halfYearly" | "yearly" | null,
    startDate: timestamp,
    endDate: timestamp,
    status: "active" | "trial" | "expired"
  }
}
```

#### `servers` Collection
```
servers/{serverId}
{
  name: string,
  url: string,
  description: string,
  uploadedBy: string, // User ID
  uploadedAt: timestamp,
  uploadedRole: "user" | "admin",
  status: "up" | "down" | "error" | "unknown",
  lastChecked: timestamp,
  responseTime: number,
  error: string | null,
  monitoring: {
    frequency: number, // Check frequency in minutes
    daysOfWeek: array, // [0,1,2,3,4,5,6] where 0=Sunday
    timeWindows: [
      { start: "09:00", end: "17:00" } // Time windows to monitor
    ],
    alerts: {
      enabled: boolean,
      email: boolean,
      responseThreshold: number // Alert if response time exceeds this value (ms)
    },
    trialEndsAt: timestamp // When the free trial ends
  }
}
```

## 4. API Routes

### Authentication Endpoints
- `/api/auth/register` - Create new user
- `/api/auth/login` - User login
- `/api/auth/verify-email` - Email verification

### Server Management Endpoints
- `/api/servers` - List/create servers
- `/api/servers/[id]` - Get/update/delete a specific server
- `/api/check-servers` - Run checks on all servers (called by cron job)
- `/api/check-server/[id]` - Check a specific server

### Subscription Endpoints
- `/api/plans` - List available subscription plans
- `/api/subscribe` - Subscribe to a plan

## 5. Implementation Details

### User Registration Flow
1. User registers with email/password
2. Verification email is sent
3. User account created as regular "user" role
4. Admin role is set manually in Firestore

### Server Upload Flow
1. User navigates to Server UI Upload Page
2. System checks user's current plan and server count
3. User can add servers up to their plan limit
4. Each server has a 2-day trial period
   - Warning message about trial period is shown for each server
5. When approaching or exceeding server limit:
   - Pricing plan popup appears
   - User must select a subscription to continue adding servers
6. Pricing options clearly displayed:
   - Monthly: $8/month
   - Half-yearly: $45
   - Yearly: $85

### Server Monitoring Flow
1. Servers are checked automatically based on configuration
2. Status is updated in Firestore
3. Email alerts are sent if server is down/slow
4. User can view current status on dashboard

### Pricing Implementation
1. Monthly plan: $8/month
2. Half-yearly plan: $45 (discounted from monthly)
3. Yearly plan: $85 (discounted from monthly)
4. Payment processing through Stripe integration

## 6. Development Roadmap

### Phase 1: Core Functionality
- Authentication system
- Basic server monitoring
- Single server upload for users
- Admin view of all servers

### Phase 2: Subscription System
- Trial period implementation
- Pricing plans integration
- Payment processing
- User plan management

### Phase 3: Advanced Monitoring
- Customizable monitoring schedule
- Advanced alert settings
- Server dropdown navigation
- Detailed server stats

### Phase 4: Enhancements
- Mobile responsive design
- Performance optimizations
- Additional notification channels
- Advanced analytics

## 7. Technical Considerations

### Next.js 15 Features to Utilize
- App Router for page structure
- Server Components for initial rendering
- Client Components for interactive elements
- Server Actions for form submissions
- API Routes for backend functionality
- Middleware for authentication

### Firebase Integration
- Client-side SDK for real-time updates
- Server-side admin SDK for secure operations
- Firebase Authentication for user management
- Firestore for data storage

### Monitoring Implementation
- Server-side checks for reliability
- XMLHttpRequest for status checking
- Nodemailer for email notifications
- Cron jobs for scheduled monitoring