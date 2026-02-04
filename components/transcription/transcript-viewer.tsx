'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TranscriptionResult, TranscriptionSegment } from '@/types';
import { VOXTRAL_PRICE_PER_MINUTE } from '@/types';

interface TranscriptViewerProps {
  result: TranscriptionResult;
  className?: string;
}

type ViewMode = 'speakers' | 'plain' | 'segments';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatTranscriptionTime(ms: number): string {
  const seconds = ms / 1000;
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  return `${seconds.toFixed(1)}s`;
}

function getSpeakerColor(speaker: string): string {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-orange-100 text-orange-800',
    'bg-pink-100 text-pink-800',
    'bg-cyan-100 text-cyan-800',
  ];
  
  // Extract number from speaker name (e.g., "SPEAKER_00" -> 0)
  const match = speaker.match(/\d+/);
  const index = match ? parseInt(match[0]) : 0;
  return colors[index % colors.length];
}

export function TranscriptViewer({ result, className }: TranscriptViewerProps) {
  const hasSegments = result.segments && result.segments.length > 0;
  const hasSpeakerText = result.speaker_text && result.speaker_text.length > 0;
  
  // Determine default view mode based on available data
  const defaultViewMode: ViewMode = hasSegments ? 'speakers' : (hasSpeakerText ? 'speakers' : 'plain');
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Group segments by speaker for display (only if segments exist)
  const groupedSegments = hasSegments 
    ? result.segments!.reduce((acc, segment) => {
        const lastGroup = acc[acc.length - 1];
        if (lastGroup && lastGroup.speaker === segment.speaker) {
          lastGroup.segments.push(segment);
          lastGroup.end = segment.end;
          lastGroup.text += ' ' + segment.text;
        } else {
          acc.push({
            speaker: segment.speaker || 'Unknown',
            start: segment.start,
            end: segment.end,
            text: segment.text,
            segments: [segment],
          });
        }
        return acc;
      }, [] as Array<{ speaker: string; start: number; end: number; text: string; segments: TranscriptionSegment[] }>)
    : [];

  // Get detected language (handle both formats)
  const detectedLanguage = result.detected_language || result.language;

  // Get the best text to display for speaker view
  const getSpeakerContent = () => {
    if (hasSegments && groupedSegments.length > 0) {
      return (
        <div className="space-y-4">
          {groupedSegments.map((group, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-xs', getSpeakerColor(group.speaker))}>
                  {group.speaker.replace('SPEAKER_', 'Speaker ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTime(group.start)} - {formatTime(group.end)}
                </span>
              </div>
              <p className="text-sm leading-relaxed pl-2 border-l-2 border-muted">
                {group.text}
              </p>
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback to speaker_text if no segments
    if (hasSpeakerText) {
      return (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {result.speaker_text}
        </p>
      );
    }
    
    // Final fallback to plain text
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {result.text}
      </p>
    );
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-4">
          <CardTitle className="text-lg font-medium">Transcription</CardTitle>
          {detectedLanguage && (
            <Badge variant="secondary" className="text-xs">
              {detectedLanguage.toUpperCase()}
            </Badge>
          )}
        </div>
        
        {/* View mode toggle - only show if we have segments */}
        {hasSegments && (
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(['speakers', 'plain', 'segments'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  viewMode === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode === 'speakers' ? 'Speakers' : mode === 'plain' ? 'Plain' : 'Segments'}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Metrics bar */}
        {(result.audioDurationSeconds || result.transcriptionTimeMs || result.cost !== undefined) && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            {result.audioDurationSeconds && (
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Audio: <strong className="text-foreground">{formatDuration(result.audioDurationSeconds)}</strong></span>
              </div>
            )}
            {result.transcriptionTimeMs && (
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Transcription: <strong className="text-foreground">{formatTranscriptionTime(result.transcriptionTimeMs)}</strong></span>
              </div>
            )}
            {result.cost !== undefined && result.cost > 0 && (
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Cost: <strong className="text-foreground">${result.cost.toFixed(4)}</strong> <span className="text-xs">(${VOXTRAL_PRICE_PER_MINUTE}/min)</span></span>
              </div>
            )}
          </div>
        )}

        {/* Transcript content */}
        <div className="max-h-[500px] overflow-y-auto rounded-lg border bg-muted/30 p-4">
          {viewMode === 'speakers' && getSpeakerContent()}

          {viewMode === 'plain' && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {result.text}
            </p>
          )}

          {viewMode === 'segments' && hasSegments && (
            <div className="space-y-2">
              {result.segments!.map((segment, index) => (
                <div key={index} className="flex gap-3 text-sm">
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {formatTime(segment.start)}
                  </span>
                  {segment.speaker && (
                    <Badge className={cn('text-xs shrink-0', getSpeakerColor(segment.speaker))}>
                      {segment.speaker.replace('SPEAKER_', 'S')}
                    </Badge>
                  )}
                  <span className="flex-1">{segment.text}</span>
                </div>
              ))}
            </div>
          )}
          
          {viewMode === 'segments' && !hasSegments && (
            <p className="text-sm text-muted-foreground italic">
              Segment-level timing is not available for this transcription.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(result.speaker_text || result.text)}
          >
            {copied ? (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(result.text, 'transcription.txt')}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            TXT
          </Button>
          
          {hasSpeakerText && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(result.speaker_text!, 'transcription-speakers.txt')}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              With Speakers
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJSON}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
