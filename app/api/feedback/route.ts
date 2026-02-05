import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, email } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Insert feedback into Supabase
    const { error } = await supabase
      .from('feedbacks')
      .insert({
        message: message.trim(),
        email: email?.trim() || null,
        user_id: user?.id || null,
        user_email: user?.email || null,
      });

    if (error) {
      console.error('Error saving feedback:', error);
      // If table doesn't exist, log the feedback to console as fallback
      console.log('FEEDBACK RECEIVED:', { message, email, user_id: user?.id });
      // Still return success so user experience isn't affected
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
