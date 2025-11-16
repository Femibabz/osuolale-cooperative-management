# OsuOlale Cooperative Society Management System

A comprehensive, modern cooperative society management system built with Next.js 15 and TypeScript. This system provides complete management capabilities for cooperative societies, including member management, loan tracking, savings monitoring, and application processing workflows.

## 🚀 Features

### Member Management
- **Member Registration**: Complete application workflow with approval/rejection system
- **Profile Management**: Comprehensive member profiles with contact information
- **Shares & Savings Separation**: Clear distinction between share contributions and savings
- **12-Month Transaction History**: Detailed transaction tracking and history

### Loan Management
- **Loan Applications**: Members can apply for loans with detailed application forms
- **Loan Approval Workflow**: Admin approval/rejection system with comments
- **Interest Calculations**: Automatic interest calculation based on loan duration
- **Loan Duration Tracking**: Comprehensive tracking of loan terms and repayment schedules
- **Loan Status Monitoring**: Real-time status updates for all loans

### Administrative Features
- **Admin Dashboard**: Comprehensive overview of all cooperative activities
- **Application Processing**: Streamlined workflow for membership and loan applications
- **Member Oversight**: Complete member management and monitoring capabilities
- **Financial Reporting**: Transaction history and financial overview

### Technical Features
- **Email Notifications**: Automated email notifications using EmailJS
- **Local Storage Persistence**: Client-side data persistence for demo purposes
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI Components**: Built with shadcn/ui component library
- **Type Safety**: Full TypeScript implementation

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Email Service**: EmailJS
- **State Management**: React Context
- **Data Persistence**: Local Storage (demo)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Femibabz/osuolale-cooperative-management.git
   cd osuolale-cooperative-management
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Run the development server**
   ```bash
   bun dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Demo Credentials

### Admin Access
- **Username**: `admin`
- **Password**: `admin123`

### Member Access
- **Username**: `john@email.com`
- **Password**: `password123`

## 📖 Usage Guide

### For Members
1. **Registration**: Apply for membership through the application form
2. **Dashboard**: Access your personal dashboard to view account summary
3. **Loan Applications**: Apply for loans with detailed forms
4. **Transaction History**: View your complete financial history
5. **Profile Management**: Update your personal information

### For Administrators
1. **Member Management**: Review, approve, or reject membership applications
2. **Loan Processing**: Process loan applications with approval workflow
3. **Financial Oversight**: Monitor all transactions and member activities
4. **System Administration**: Manage the overall cooperative operations

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard pages
│   ├── member/            # Member dashboard pages
│   └── apply/             # Application pages
├── components/
│   └── ui/                # Reusable UI components
├── contexts/              # React context providers
├── lib/                   # Utility functions and services
│   ├── email-service.ts   # EmailJS integration
│   ├── loan-utils.ts      # Loan calculation utilities
│   └── mock-data.ts       # Demo data
└── types/                 # TypeScript type definitions
```

## 🔧 Key Features Implementation

### Shares vs Savings Separation
The system clearly distinguishes between:
- **Shares**: Member equity contributions to the cooperative
- **Savings**: Personal savings accounts managed by the cooperative

### Loan Interest Calculations
- Automatic calculation based on loan duration
- Configurable interest rates
- Clear repayment schedules

### Email Notifications
- Automated notifications for application status changes
- Loan approval/rejection notifications
- Welcome emails for new members

### Transaction History
- 12-month rolling transaction history
- Detailed transaction categorization
- Export capabilities for financial records

## 🌐 Deployment

The application is configured for deployment on Netlify with the included `netlify.toml` configuration file.

### Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Build command: `bun run build`
3. Publish directory: `.next`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Email service by [EmailJS](https://www.emailjs.com/)

---

**Note**: This is a demonstration system using local storage for data persistence. For production use, integrate with a proper database and authentication system.
