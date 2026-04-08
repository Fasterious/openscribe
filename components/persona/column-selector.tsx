'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ColumnInfo {
  index: number;
  name: string;
  sampleValues: string[];
  isNumeric: boolean;
  uniqueValues: number;
}

export function ColumnSelector({
  columns,
  selectedIndices,
  onSelectionChange,
  onAutoDetect,
  autoDetecting,
}: {
  columns: ColumnInfo[];
  selectedIndices: number[];
  onSelectionChange: (indices: number[]) => void;
  onAutoDetect?: () => void;
  autoDetecting?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayColumns = showAll ? columns : columns.slice(0, 20);

  const toggle = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      onSelectionChange(selectedIndices.filter((i) => i !== idx));
    } else {
      onSelectionChange([...selectedIndices, idx]);
    }
  };

  const selectAllNumeric = () => {
    const numeric = columns.filter((c) => c.isNumeric && c.uniqueValues <= 10).map((c) => c.index);
    onSelectionChange(numeric);
  };

  const selectAll = () => {
    onSelectionChange(columns.map((c) => c.index));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Selection des colonnes Likert
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Selectionnez les colonnes contenant des echelles numeriques (1-5, 1-7, 1-10, etc.)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Tout selectionner
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Tout deselectionner
          </Button>
          <Button variant="outline" size="sm" onClick={selectAllNumeric}>
            Numeriques uniquement
          </Button>
          {onAutoDetect && (
            <Button variant="default" size="sm" onClick={onAutoDetect} disabled={autoDetecting}>
              {autoDetecting ? 'Analyse IA...' : 'Recommandation IA'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {displayColumns.map((col) => {
          const isSelected = selectedIndices.includes(col.index);
          return (
            <button
              key={col.index}
              onClick={() => toggle(col.index)}
              className={`text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[13px] font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {col.name}
                </span>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-primary border-primary' : 'border-border'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {col.isNumeric ? (
                  <span className="text-green-600 dark:text-green-400">{col.uniqueValues} valeurs uniques</span>
                ) : (
                  <span className="text-orange-500">Non-numerique</span>
                )}
                {' · '}
                <span className="italic">{col.sampleValues.slice(0, 3).join(', ')}</span>
              </div>
            </button>
          );
        })}
      </div>

      {columns.length > 20 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[12px] text-primary hover:underline"
        >
          {showAll ? 'Voir moins' : `Voir les ${columns.length} colonnes`}
        </button>
      )}

      <div className="text-[12px] text-muted-foreground">
        {selectedIndices.length} colonnes selectionnees
      </div>
    </div>
  );
}

export type { ColumnInfo };
