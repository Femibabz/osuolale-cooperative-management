/**
 * Comprehensive Test Script for OsuOlale Membership Application Flow
 * This script tests the entire membership application and review process
 */

// Mock localStorage for Node.js environment
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Mock window object
global.window = { localStorage: global.localStorage };

// Mock emailjs
global.emailjs = {
  init: () => {},
  send: () => Promise.resolve({ text: 'OK' })
};

// Import the modules we need to test
const { MockDatabase } = require('./src/lib/mock-data');
const { EmailService } = require('./src/lib/email-service');

class MembershipFlowTester {
  constructor() {
    this.db = new MockDatabase();
    this.testResults = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.testResults.push(logEntry);
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  error(message, error = null) {
    this.errors.push({ message, error });
    this.log(message, 'error');
    if (error) {
      console.error(error);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test 1: Verify admin login credentials
  testAdminLogin() {
    this.log('Testing admin login credentials...');

    const adminUser = this.db.findUserByEmail('admin@osuolale.com');
    if (adminUser && adminUser.password === 'admin123' && adminUser.role === 'admin') {
      this.log('✅ Admin login credentials verified successfully');
      return true;
    } else {
      this.error('❌ Admin login credentials verification failed');
      return false;
    }
  }

  // Test 2: Check current pending applications
  checkPendingApplications() {
    this.log('Checking current pending applications...');

    const applications = this.db.getApplications();
    const pendingApps = applications.filter(app => app.status === 'pending');

    this.log(`Found ${applications.length} total applications, ${pendingApps.length} pending`);

    pendingApps.forEach(app => {
      this.log(`  - ${app.firstName} ${app.lastName} (${app.email}) - Applied: ${app.appliedAt.toLocaleDateString()}`);
    });

    return pendingApps;
  }

  // Test 3: Submit a new membership application
  submitNewApplication() {
    this.log('Submitting a new membership application...');

    const testApplicationData = {
      firstName: 'Test',
      lastName: 'Applicant',
      email: 'test.applicant@email.com',
      phone: '+234-807-123-4567',
      address: '123 Test Street, Test City',
      occupation: 'Software Tester',
      monthlyIncome: 180000,
      guarantorName: 'Test Guarantor',
      guarantorPhone: '+234-808-234-5678',
      guarantorAddress: '456 Guarantor Lane, Test City'
    };

    try {
      const newApplication = this.db.createApplication(testApplicationData);
      this.log(`✅ Successfully submitted application for ${newApplication.firstName} ${newApplication.lastName}`);
      this.log(`   Application ID: ${newApplication.id}`);
      this.log(`   Status: ${newApplication.status}`);
      return newApplication;
    } catch (error) {
      this.error('❌ Failed to submit new application', error);
      return null;
    }
  }

  // Test 4: Test application approval process
  async testApplicationApproval(application) {
    this.log(`Testing approval process for ${application.firstName} ${application.lastName}...`);

    try {
      // Step 1: Update application status to approved
      const reviewNotes = 'Application meets all criteria. Approved for membership.';
      const updatedApplication = this.db.updateApplication(application.id, {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        reviewNotes: reviewNotes,
      });

      if (!updatedApplication) {
        this.error('❌ Failed to update application status');
        return false;
      }

      this.log('✅ Application status updated to approved');

      // Step 2: Create user account
      const user = this.db.createUser({
        email: application.email,
        password: 'member123',
        role: 'member',
      });

      this.log(`✅ User account created with ID: ${user.id}`);

      // Step 3: Generate member number and create member record
      const memberCount = this.db.getMembers().length;
      const memberNumber = `OSU${String(memberCount + 1).padStart(3, '0')}`;

      const newMember = this.db.createMember({
        userId: user.id,
        memberNumber,
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        phone: application.phone,
        address: application.address,
        status: 'active',
        sharesBalance: 0,
        savingsBalance: 0,
        loanBalance: 0,
        interestBalance: 0,
        societyDues: 0,
      });

      this.log(`✅ Member record created with number: ${newMember.memberNumber}`);

      // Step 4: Test email notification
      const emailSent = await EmailService.sendApprovalEmail({
        applicantName: `${application.firstName} ${application.lastName}`,
        applicantEmail: application.email,
        memberNumber: newMember.memberNumber,
        loginEmail: application.email,
        loginPassword: 'member123',
      });

      if (emailSent) {
        this.log('✅ Approval email notification sent successfully');
      } else {
        this.error('❌ Failed to send approval email notification');
      }

      this.log('✅ Application approval process completed successfully');
      return true;

    } catch (error) {
      this.error('❌ Application approval process failed', error);
      return false;
    }
  }

  // Test 5: Test application rejection process
  async testApplicationRejection(application) {
    this.log(`Testing rejection process for ${application.firstName} ${application.lastName}...`);

    try {
      // Step 1: Update application status to rejected
      const rejectionReason = 'Insufficient income documentation provided.';
      const updatedApplication = this.db.updateApplication(application.id, {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        reviewNotes: rejectionReason,
      });

      if (!updatedApplication) {
        this.error('❌ Failed to update application status to rejected');
        return false;
      }

      this.log('✅ Application status updated to rejected');

      // Step 2: Test email notification
      const emailSent = await EmailService.sendRejectionEmail({
        applicantName: `${application.firstName} ${application.lastName}`,
        applicantEmail: application.email,
        rejectionReason: rejectionReason,
      });

      if (emailSent) {
        this.log('✅ Rejection email notification sent successfully');
      } else {
        this.error('❌ Failed to send rejection email notification');
      }

      this.log('✅ Application rejection process completed successfully');
      return true;

    } catch (error) {
      this.error('❌ Application rejection process failed', error);
      return false;
    }
  }

  // Test 6: Verify data persistence
  testDataPersistence() {
    this.log('Testing data persistence...');

    try {
      // Test that localStorage is being used
      const storedApplications = global.localStorage.getItem('osuolale_applications');
      const storedMembers = global.localStorage.getItem('osuolale_members');
      const storedUsers = global.localStorage.getItem('osuolale_users');

      if (storedApplications && storedMembers && storedUsers) {
        this.log('✅ Data is being persisted to localStorage');

        const apps = JSON.parse(storedApplications);
        const members = JSON.parse(storedMembers);
        const users = JSON.parse(storedUsers);

        this.log(`   Applications stored: ${apps.length}`);
        this.log(`   Members stored: ${members.length}`);
        this.log(`   Users stored: ${users.length}`);

        return true;
      } else {
        this.error('❌ Data persistence test failed - missing localStorage data');
        return false;
      }
    } catch (error) {
      this.error('❌ Data persistence test failed', error);
      return false;
    }
  }

  // Main test runner
  async runAllTests() {
    this.log('Starting comprehensive membership flow testing...', 'info');
    this.log('===============================================');

    let testsPassed = 0;
    let totalTests = 6;

    // Test 1: Admin login
    if (this.testAdminLogin()) testsPassed++;

    // Test 2: Check pending applications
    const pendingApps = this.checkPendingApplications();

    // Test 3: Submit new application
    const newApplication = this.submitNewApplication();
    if (newApplication) testsPassed++;

    // Test 4: Test approval process
    if (newApplication && await this.testApplicationApproval(newApplication)) {
      testsPassed++;
    }

    // Test 5: Test rejection process (use existing pending or create another)
    let rejectionTestApp = pendingApps.length > 0 ? pendingApps[0] : this.submitNewApplication();
    if (rejectionTestApp && await this.testApplicationRejection(rejectionTestApp)) {
      testsPassed++;
    }

    // Test 6: Data persistence
    if (this.testDataPersistence()) testsPassed++;

    // Additional test: Verify final state
    const finalApplications = this.db.getApplications();
    const finalMembers = this.db.getMembers();
    if (finalApplications.length > 0 && finalMembers.length > 0) {
      testsPassed++;
      totalTests++;
      this.log('✅ Final state verification passed');
    }

    // Generate summary report
    this.generateReport(testsPassed, totalTests);
  }

  generateReport(testsPassed, totalTests) {
    this.log('===============================================');
    this.log('TEST SUMMARY REPORT', 'info');
    this.log('===============================================');

    this.log(`Tests Passed: ${testsPassed}/${totalTests}`);
    this.log(`Success Rate: ${((testsPassed/totalTests) * 100).toFixed(1)}%`);

    if (this.errors.length > 0) {
      this.log('\nERRORS ENCOUNTERED:', 'error');
      this.errors.forEach((err, index) => {
        this.log(`${index + 1}. ${err.message}`, 'error');
      });
    }

    // Final state report
    const applications = this.db.getApplications();
    const members = this.db.getMembers();
    const users = this.db.getUsers ? this.db.getUsers() : [];

    this.log('\nFINAL SYSTEM STATE:');
    this.log(`- Total Applications: ${applications.length}`);
    this.log(`  - Pending: ${applications.filter(a => a.status === 'pending').length}`);
    this.log(`  - Approved: ${applications.filter(a => a.status === 'approved').length}`);
    this.log(`  - Rejected: ${applications.filter(a => a.status === 'rejected').length}`);
    this.log(`- Total Members: ${members.length}`);
    this.log(`- Total Users: ${users.length || 'N/A'}`);

    this.log('===============================================');

    if (testsPassed === totalTests) {
      this.log('🎉 ALL TESTS PASSED! The membership flow is working correctly.', 'info');
    } else {
      this.log('⚠️  Some tests failed. Please review the errors above.', 'error');
    }
  }
}

// Run the tests
console.log('Initializing Membership Flow Testing...\n');

const tester = new MembershipFlowTester();
tester.runAllTests().catch(error => {
  console.error('Test execution failed:', error);
});
