import { NextRequest, NextResponse } from 'next/server';
import { generatePasswordResetToken, getUserByEmail } from '@/lib/db/users';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const token = await generatePasswordResetToken(email);
    
    if (!token) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // In a real application, you would send an email here
    // For now, we'll return the token in the response (for testing purposes)
    // In production, NEVER return the token - send it via email only
    
    // TODO: Implement email sending with a service like SendGrid, AWS SES, etc.
    // const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    // await sendEmail(email, 'Password Reset', `Click here to reset your password: ${resetLink}`);

    console.log(`Password reset token for ${email}: ${token}`);
    
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Remove this in production - only for testing
      resetToken: process.env.NODE_ENV === 'development' ? token : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

