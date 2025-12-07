import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, getAllUsers } from '@/lib/db/users';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, companyName } = await request.json();

    if (!email || !password || !name || !companyName) {
      return NextResponse.json(
        { error: 'Email, password, name, and company name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if this is the first user - make them admin (auto-approved)
    const allUsers = await getAllUsers();
    const isFirstUser = allUsers.length === 0;

    // Create new user - NOT auto-logged in, pending approval (unless first user)
    const user = await createUser({
      email: email.toLowerCase(),
      password,
      name,
      companyName,
      role: isFirstUser ? 'admin' : 'member',
      status: isFirstUser ? 'approved' : 'pending', // First user auto-approved, others need admin approval
    });

    // Don't auto-login - user needs admin approval first (unless first user)
    if (isFirstUser) {
      return NextResponse.json({
        success: true,
        message: 'Admin account created. You can now login.',
        requiresApproval: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval. You will be able to login once approved.',
      requiresApproval: true,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

