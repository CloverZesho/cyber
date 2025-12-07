import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, updateUser } from '@/lib/db/users';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await verifyPassword(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is approved
    if (user.status === 'pending') {
      return NextResponse.json(
        { error: 'Your account is pending admin approval. Please wait for approval.' },
        { status: 403 }
      );
    }

    if (user.status === 'rejected') {
      return NextResponse.json(
        { error: 'Your account has been rejected. Please contact support.' },
        { status: 403 }
      );
    }

    // Update last login time
    await updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const token = await createToken(user);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

