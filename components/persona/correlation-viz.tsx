'use client';

import { useState } from 'react';
import type { PersonaRespondent, CorrelationData } from '@/types/persona';

interface CellInfo {
  r1: string; r2: string; val: number;
  r1Cluster: string; r2Cluster: string;
  r1Color: string; r2Color: string;
  details: { question: string; v1: number; v2: number; correlated: boolean }[];
}

interface HoverPos { rowIdx: number; colIdx: number }

function TotalMatrix({
  matrix,
  respondents,
  clusterMap,
  sortedIndices,
  perQuestion,
  columnNames,
}: {
  matrix: number[][];
  respondents: PersonaRespondent[];
  clusterMap: Map<string, { color: string; label: string }>;
  sortedIndices: number[];
  perQuestion: number[][][];
  columnNames: string[];
}) {
  const [hoveredCell, setHoveredCell] = useState<CellInfo | null>(null);
  const [hoverPos, setHoverPos] = useState<HoverPos | null>(null);
  const cellSize = 13;
  const labelW = 48;
  const colHeaderH = 52;

  let maxVal = 0;
  for (let i = 0; i < respondents.length; i++)
    for (let j = 0; j < respondents.length; j++)
      if (i !== j && matrix[i][j] > maxVal) maxVal = matrix[i][j];

  const getColor = (val: number, isSelf: boolean) => {
    if (isSelf) return '#94a3b8';
    if (val === 0) return '#f8fafc';
    const ratio = val / maxVal;
    if (ratio >= 0.85) return '#15803d';
    if (ratio >= 0.7) return '#22c55e';
    if (ratio >= 0.55) return '#86efac';
    if (ratio >= 0.4) return '#fde047';
    if (ratio >= 0.25) return '#fed7aa';
    return '#f1f5f9';
  };

  const getTextColor = (val: number) => {
    const ratio = val / maxVal;
    return ratio >= 0.55 ? '#fff' : '#334155';
  };

  const buildCellInfo = (si: number, sj: number): CellInfo => {
    const r1 = respondents[si];
    const r2 = respondents[sj];
    return {
      r1: r1.id, r2: r2.id,
      val: matrix[si][sj],
      r1Cluster: clusterMap.get(r1.id)?.label || '?',
      r2Cluster: clusterMap.get(r2.id)?.label || '?',
      r1Color: clusterMap.get(r1.id)?.color || '#888',
      r2Color: clusterMap.get(r2.id)?.color || '#888',
      details: columnNames.map((col, qi) => ({
        question: col,
        v1: r1.values[qi],
        v2: r2.values[qi],
        correlated: perQuestion[qi][si][sj] === 1,
      })),
    };
  };

  const groupBoundaries: number[] = [];
  let lastLabel = '';
  sortedIndices.forEach((si, pos) => {
    const label = clusterMap.get(respondents[si].id)?.label || '';
    if (label !== lastLabel && pos > 0) groupBoundaries.push(pos);
    lastLabel = label;
  });

  const isHighlightedRow = (rowIdx: number) => hoverPos !== null && hoverPos.rowIdx === rowIdx;
  const isHighlightedCol = (colIdx: number) => hoverPos !== null && hoverPos.colIdx === colIdx;
  const isHoveredCell = (rowIdx: number, colIdx: number) =>
    hoverPos !== null && hoverPos.rowIdx === rowIdx && hoverPos.colIdx === colIdx;

  return (
    <div className="flex gap-4 flex-wrap">
      <div className="overflow-auto flex-1 min-w-0">
        <div className="flex" style={{ marginLeft: labelW, height: colHeaderH }}>
          {sortedIndices.map((si, pos) => {
            const color = clusterMap.get(respondents[si].id)?.color || '#ccc';
            const highlighted = isHighlightedCol(pos);
            return (
              <div
                key={si}
                style={{
                  width: cellSize, height: colHeaderH,
                  marginLeft: groupBoundaries.includes(pos) ? 2 : 0,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2,
                    fontSize: 8, color: highlighted ? '#0f172a' : '#64748b',
                    fontWeight: highlighted ? 700 : 400, lineHeight: 1,
                  }}
                >
                  <span style={{
                    display: 'inline-block', width: 6, height: 6,
                    borderRadius: '50%', backgroundColor: color, flexShrink: 0,
                  }} />
                  {respondents[si].id}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 4 }}>
          {sortedIndices.map((si, rowIdx) => {
            const rowHighlighted = isHighlightedRow(rowIdx);
            return (
              <div
                key={si}
                className="flex items-center"
                style={{ marginTop: groupBoundaries.includes(rowIdx) ? 2 : 0 }}
              >
                <div
                  className="text-right pr-1 flex items-center gap-0.5 justify-end"
                  style={{
                    width: labelW, fontSize: 8,
                    color: rowHighlighted ? '#0f172a' : '#64748b',
                    fontWeight: rowHighlighted ? 700 : 400,
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: clusterMap.get(respondents[si].id)?.color || '#ccc' }}
                  />
                  {respondents[si].id}
                </div>

                {sortedIndices.map((sj, colIdx) => {
                  const val = matrix[si][sj];
                  const isSelf = si === sj;
                  const hovered = isHoveredCell(rowIdx, colIdx);
                  const inCross = isHighlightedRow(rowIdx) || isHighlightedCol(colIdx);

                  return (
                    <div
                      key={sj}
                      onMouseEnter={() => {
                        setHoverPos({ rowIdx, colIdx });
                        if (!isSelf) setHoveredCell(buildCellInfo(si, sj));
                      }}
                      onMouseLeave={() => { setHoverPos(null); setHoveredCell(null); }}
                      style={{
                        width: cellSize, height: cellSize,
                        backgroundColor: getColor(val, isSelf),
                        fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelf ? '#fff' : getTextColor(val),
                        cursor: isSelf ? 'default' : 'pointer',
                        marginLeft: groupBoundaries.includes(colIdx) ? 2 : 0,
                        outline: hovered ? '2px solid #0f172a' : 'none',
                        outlineOffset: -1, zIndex: hovered ? 10 : 'auto', position: 'relative',
                        boxShadow: hovered ? '0 0 6px rgba(0,0,0,0.4)' : inCross && !isSelf ? 'inset 0 0 0 0.5px rgba(15,23,42,0.2)' : 'none',
                        opacity: hoverPos !== null && !inCross && !hovered ? 0.4 : 1,
                        transition: 'opacity 0.1s',
                        borderRight: '0.5px solid rgba(226,232,240,0.5)',
                        borderBottom: '0.5px solid rgba(226,232,240,0.5)',
                      }}
                    >
                      {!isSelf && val > 0 ? val : ''}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
          <span>Faible</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((r) => (
            <div key={r} className="w-4 h-4 rounded-sm" style={{ backgroundColor: getColor(Math.round(r * maxVal), false) }} />
          ))}
          <span>Fort ({maxVal})</span>
        </div>
      </div>

      <div className="w-64 shrink-0 bg-muted/50 border border-border rounded-lg p-3 text-[12px] self-start sticky top-0">
        {hoveredCell ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: hoveredCell.r1Color }} />
              <strong>{hoveredCell.r1}</strong>
              <span className="text-muted-foreground">&times;</span>
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: hoveredCell.r2Color }} />
              <strong>{hoveredCell.r2}</strong>
            </div>
            <div className="text-[22px] mb-1">
              {hoveredCell.val} / {columnNames.length} correlations
            </div>
            <div className="text-[10px] text-muted-foreground mb-2">
              {hoveredCell.r1Cluster} — {hoveredCell.r2Cluster}
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left py-0.5">Q</th>
                  <th className="text-center py-0.5">{hoveredCell.r1}</th>
                  <th className="text-center py-0.5">{hoveredCell.r2}</th>
                  <th className="text-center py-0.5">|Delta|</th>
                  <th className="text-center py-0.5"></th>
                </tr>
              </thead>
              <tbody>
                {hoveredCell.details.map((d) => (
                  <tr key={d.question} className={d.correlated ? 'bg-green-50 dark:bg-green-950/30' : ''}>
                    <td className="py-0.5">{d.question}</td>
                    <td className="text-center">{d.v1}</td>
                    <td className="text-center">{d.v2}</td>
                    <td className="text-center">{Math.abs(d.v1 - d.v2)}</td>
                    <td className="text-center">{d.correlated ? '\u2713' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="text-muted-foreground text-center py-8">
            <p className="mb-1">Survolez une cellule</p>
            <p className="text-[10px]">pour voir le detail des correlations question par question</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionMatrices({
  perQuestion,
  respondents,
  clusterMap,
  sortedIndices,
  columnNames,
}: {
  perQuestion: number[][][];
  respondents: PersonaRespondent[];
  clusterMap: Map<string, { color: string; label: string }>;
  sortedIndices: number[];
  columnNames: string[];
}) {
  const [selectedQ, setSelectedQ] = useState(0);
  const [hoveredPair, setHoveredPair] = useState<{ r1: string; r2: string; v1: number; v2: number; corr: boolean } | null>(null);
  const [hoverPos, setHoverPos] = useState<HoverPos | null>(null);
  const cellSize = 12;
  const labelW = 44;
  const colHeaderH = 48;
  const qm = perQuestion[selectedQ];

  const isHighlightedRow = (ri: number) => hoverPos !== null && hoverPos.rowIdx === ri;
  const isHighlightedCol = (ci: number) => hoverPos !== null && hoverPos.colIdx === ci;
  const isHoveredCell = (ri: number, ci: number) =>
    hoverPos !== null && hoverPos.rowIdx === ri && hoverPos.colIdx === ci;

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {columnNames.map((col, qi) => (
          <button
            key={col}
            onClick={() => setSelectedQ(qi)}
            className={`px-2.5 py-1 rounded text-[12px] transition-colors ${
              selectedQ === qi ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {col}
          </button>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="overflow-auto flex-1 min-w-0">
          <div className="flex" style={{ marginLeft: labelW, height: colHeaderH }}>
            {sortedIndices.map((si, pos) => {
              const color = clusterMap.get(respondents[si].id)?.color || '#ccc';
              const highlighted = isHighlightedCol(pos);
              return (
                <div key={si} style={{ width: cellSize, height: colHeaderH, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{
                    writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2,
                    fontSize: 7, color: highlighted ? '#0f172a' : '#64748b',
                    fontWeight: highlighted ? 700 : 400, lineHeight: 1,
                  }}>
                    <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    {respondents[si].id}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 4 }}>
            {sortedIndices.map((si, rowIdx) => {
              const rowHighlighted = isHighlightedRow(rowIdx);
              return (
                <div key={si} className="flex items-center">
                  <div
                    className="text-right pr-1 flex items-center gap-0.5 justify-end"
                    style={{ width: labelW, fontSize: 7, color: rowHighlighted ? '#0f172a' : '#64748b', fontWeight: rowHighlighted ? 700 : 400 }}
                  >
                    <span className="inline-block shrink-0 rounded-full" style={{ width: 5, height: 5, backgroundColor: clusterMap.get(respondents[si].id)?.color || '#ccc' }} />
                    {respondents[si].id}
                  </div>
                  {sortedIndices.map((sj, colIdx) => {
                    const val = qm[si][sj];
                    const isSelf = si === sj;
                    const hovered = isHoveredCell(rowIdx, colIdx);
                    const inCross = isHighlightedRow(rowIdx) || isHighlightedCol(colIdx);
                    const bgColor = isSelf ? '#94a3b8' : val === 1 ? (clusterMap.get(respondents[si].id)?.color || '#22c55e') : '#f1f5f9';

                    return (
                      <div
                        key={sj}
                        onMouseEnter={() => {
                          setHoverPos({ rowIdx, colIdx });
                          if (!isSelf) setHoveredPair({
                            r1: respondents[si].id, r2: respondents[sj].id,
                            v1: respondents[si].values[selectedQ], v2: respondents[sj].values[selectedQ],
                            corr: val === 1,
                          });
                        }}
                        onMouseLeave={() => { setHoverPos(null); setHoveredPair(null); }}
                        style={{
                          width: cellSize, height: cellSize, backgroundColor: bgColor,
                          opacity: isSelf ? 1 : hoverPos !== null && !inCross && !hovered ? 0.3 : val === 1 ? 0.7 : 1,
                          cursor: isSelf ? 'default' : 'pointer',
                          outline: hovered ? '2px solid #0f172a' : 'none', outlineOffset: -1,
                          zIndex: hovered ? 10 : 'auto', position: 'relative',
                          boxShadow: hovered ? '0 0 6px rgba(0,0,0,0.4)' : inCross && !isSelf ? 'inset 0 0 0 0.5px rgba(15,23,42,0.15)' : 'none',
                          borderRight: '0.3px solid rgba(226,232,240,0.5)',
                          borderBottom: '0.3px solid rgba(226,232,240,0.5)',
                          transition: 'opacity 0.1s',
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-52 shrink-0 bg-muted/50 border border-border rounded-lg p-3 text-[12px] self-start">
          <p className="text-[13px] mb-2 font-medium">{columnNames[selectedQ]}</p>
          {hoveredPair ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clusterMap.get(hoveredPair.r1)?.color || '#888' }} />
                <strong>{hoveredPair.r1}</strong> &rarr; <strong>{hoveredPair.v1}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clusterMap.get(hoveredPair.r2)?.color || '#888' }} />
                <strong>{hoveredPair.r2}</strong> &rarr; <strong>{hoveredPair.v2}</strong>
              </div>
              <p>|Delta| = {Math.abs(hoveredPair.v1 - hoveredPair.v2)}</p>
              <p className={hoveredPair.corr ? 'text-green-600' : 'text-red-500'}>
                {hoveredPair.corr ? '\u2713 Correles (|Delta| \u2264 1)' : '\u2717 Non correles (|Delta| > 1)'}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-[11px]">Survolez une cellule pour voir le detail</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CorrelationViz({
  correlationData,
  respondents,
  clusterMap,
  columnNames,
}: {
  correlationData: CorrelationData;
  respondents: PersonaRespondent[];
  clusterMap: Map<string, { color: string; label: string }>;
  columnNames: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Matrice de Correlation Totale</h3>
        <p className="text-[12px] text-muted-foreground mb-3">
          Nombre total de questions ou chaque paire est correlee (|Delta| &le; 1). Triee par cluster.
        </p>
        <TotalMatrix
          matrix={correlationData.totalMatrix}
          respondents={respondents}
          clusterMap={clusterMap}
          sortedIndices={correlationData.sortedIndices}
          perQuestion={correlationData.perQuestion}
          columnNames={columnNames}
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Matrice par Question</h3>
        <p className="text-[12px] text-muted-foreground mb-3">
          Selectionnez une question. Les cellules colorees = paires correlees sur cette question.
        </p>
        <QuestionMatrices
          perQuestion={correlationData.perQuestion}
          respondents={respondents}
          clusterMap={clusterMap}
          sortedIndices={correlationData.sortedIndices}
          columnNames={columnNames}
        />
      </div>
    </div>
  );
}
