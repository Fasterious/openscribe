'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface FeedbackButtonProps {
  className?: string;
}

export function FeedbackButton({ className }: FeedbackButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      setSuccess(true);
      setMessage('');
      setEmail('');

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch {
      setError(t('feedback.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2.5 text-muted-foreground shadow-md transition-all hover:text-foreground hover:shadow-lg hover:border-primary/30',
            className
          )}
          aria-label={t('feedback.button')}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">{t('feedback.button')}</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md sm:max-w-md">
        {success ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('feedback.success.title')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('feedback.success.message')}</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{t('feedback.title')}</DialogTitle>
              <DialogDescription>{t('feedback.subtitle')}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback-message" required>
                  {t('feedback.message')}
                </Label>
                <Textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('feedback.messagePlaceholder')}
                  required
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-email">
                  {t('feedback.email')}{' '}
                  <span className="text-muted-foreground font-normal">({t('feedback.optional')})</span>
                </Label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('feedback.emailPlaceholder')}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !message.trim()}>
                {loading ? <Spinner className="mr-2" /> : null}
                {t('feedback.send')}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
