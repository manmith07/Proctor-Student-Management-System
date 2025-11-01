# ProctorDiary - Proctor Management System

ProctorDiary is a comprehensive web application designed to streamline the management of student-proctor relationships in educational institutions. The system facilitates efficient communication, attendance tracking, academic performance monitoring, and query management between students and their assigned proctors.

## Features

### For Proctors

- **Dashboard**: Overview of assigned students, attendance statistics, at-risk students, and pending queries
- **Student Management**: View and manage assigned students with detailed profiles
- **Attendance Monitoring**: Track and analyze student attendance patterns across courses
- **Query Management**: Respond to and resolve student queries efficiently
- **Academic Reports**: Monitor student academic performance and generate reports

### For Students

- **Dashboard**: View academic progress, attendance records, and proctor information
- **Query System**: Submit and track queries to assigned proctors
- **Attendance Records**: Access personal attendance records across courses
- **Academic Performance**: View academic records including internal marks, quiz marks, and semester results

### Core Functionalities

- **User Authentication**: Secure login system with role-based access (student/proctor)
- **Profile Management**: Comprehensive profiles for both students and proctors
- **Real-time Communication**: Efficient query and response system
- **Academic Tracking**: Detailed academic record management
- **Attendance System**: Course-wise attendance tracking and reporting

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Radix UI components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication with password hashing
- **Deployment**: Configured for cloud deployment

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd proctor-management-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Configure your database connection string and other required variables

4. Set up the database:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Usage

After installation, the application will be available at `http://localhost:5000`.

### Login Credentials

- **Student Login**: Use student email and password with role set to "student"
- **Proctor Login**: Use faculty email and password with role set to "proctor"

## Project Structure

```
project/
├── client/             # Frontend React application
│   ├── index.html
│   └── src/
│       ├── components/ # UI components
│       ├── hooks/      # Custom React hooks
│       ├── lib/        # Utility functions
│       └── pages/      # Page components
├── server/             # Backend Node.js application
│   ├── auth.ts         # Authentication logic
│   ├── db.ts           # Database connection
│   ├── index.ts        # Server entry point
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Data access layer
│   └── vite.ts         # Vite configuration
└── shared/             # Shared code between client and server
    └── schema.ts       # Database schema definitions
```

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
