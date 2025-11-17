#!/bin/bash

# Script to update all async method calls with await

echo "Updating async method calls across the codebase..."

# Find and display all files that need updates
echo "Files that will be updated:"
grep -l "db\.getMembers()\|db\.createMember(\|db\.updateMember(\|db\.getTransactions()\|db\.createTransaction(\|db\.getLoanApplications()\|db\.createLoanApplication(\|db\.updateLoanApplication(\|db\.findUserByEmail(\|db\.createUser(\|db\.getActiveByLaws()\|db\.updateApplication(" src/**/*.tsx src/**/*.ts 2>/dev/null | grep -v mock-data.ts | sort | uniq

echo ""
echo "Total files found: $(grep -l "db\.getMembers()\|db\.createMember(\|db\.updateMember(\|db\.getTransactions()\|db\.createTransaction(\|db\.getLoanApplications()\|db\.createLoanApplication(\|db\.updateLoanApplication(\|db\.findUserByEmail(\|db\.createUser(\|db\.getActiveByLaws()\|db\.updateApplication(" src/**/*.tsx src/**/*.ts 2>/dev/null | grep -v mock-data.ts | wc -l)"

