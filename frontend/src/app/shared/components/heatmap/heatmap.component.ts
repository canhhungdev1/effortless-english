import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heatmap-container">
      <div class="heatmap-header">
        <span class="heatmap-title">Activity Heatmap</span>
        <div class="heatmap-legend">
          <span>Less</span>
          <div class="legend-cells">
            <div class="cell level-0"></div>
            <div class="cell level-1"></div>
            <div class="cell level-2"></div>
            <div class="cell level-3"></div>
            <div class="cell level-4"></div>
          </div>
          <span>More</span>
        </div>
      </div>
      
      <div class="heatmap-scroll">
        <div class="heatmap-wrapper">
          <div class="heatmap-grid" [style.grid-template-columns]="'repeat(' + weeks.length + ', 1fr)'">
            <div class="week-column" *ngFor="let week of weeks">
              <div 
                *ngFor="let day of week" 
                class="day-cell" 
                [class]="'level-' + getLevel(day.count)"
                [title]="day.date + ': ' + day.count + ' reviews'"
              ></div>
            </div>
          </div>
          
          <div class="month-labels" [style.grid-template-columns]="'repeat(' + weeks.length + ', 1fr)'">
            <span 
              *ngFor="let month of monthLabels" 
              [style.grid-column-start]="month.weekIdx + 1"
              class="month-name"
            >
              {{ month.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .heatmap-container {
      background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px;
      width: 100%; overflow: hidden; box-shadow: var(--shadow-sm);
    }
    .heatmap-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
    }
    .heatmap-title { font-size: 15px; font-weight: 700; color: #1e293b; }
    
    .heatmap-legend {
      display: flex; align-items: center; gap: 8px; font-size: 11px; color: #64748b;
    }
    .legend-cells { display: flex; gap: 3px; }
    .cell { width: 10px; height: 10px; border-radius: 2px; }
    
    .heatmap-scroll { 
      overflow-x: auto; padding-bottom: 10px; margin: 0 -10px;
      &::-webkit-scrollbar { height: 6px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    }

    .heatmap-wrapper {
      min-width: 800px; padding: 0 10px;
    }
    
    .heatmap-grid {
      display: grid; gap: 4px; margin-bottom: 12px;
    }
    .week-column {
      display: grid; grid-template-rows: repeat(7, 1fr); gap: 4px;
    }
    
    .day-cell {
      aspect-ratio: 1/1; width: 100%; border-radius: 2px;
      background: #f1f5f9; transition: all 0.2s;
      cursor: pointer; border: 1px solid rgba(0,0,0,0.02);
      &:hover { transform: scale(1.3); z-index: 10; border-color: rgba(0,0,0,0.1); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    }

    .month-labels {
      display: grid; gap: 4px; height: 20px; margin-top: 12px; 
      font-size: 10px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.5px;
      align-items: start; /* Align to the top of the label row */
    }
    .month-name { 
      grid-row: 1; /* Force all labels to stay on the first row */
      white-space: nowrap;
    }

    .level-0 { background: #f1f5f9; }
    .level-1 { background: #dcfce7; }
    .level-2 { background: #86efac; }
    .level-3 { background: #22c55e; }
    .level-4 { background: #166534; }
  `]
})
export class HeatmapComponent implements OnChanges {
  @Input() data: { date: string, count: number }[] = [];
  
  weeks: any[][] = [];
  monthLabels: { name: string, weekIdx: number }[] = [];

  ngOnChanges() {
    this.generateGrid();
  }

  generateGrid() {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364); // Last 52 weeks
    
    // Adjust to start on a Sunday (or Monday)
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const dataMap = new Map(this.data.map(d => [d.date, d.count]));
    
    const weeks: any[][] = [];
    const months: { name: string, weekIdx: number }[] = [];
    let currentMonth = -1;

    for (let w = 0; w < 53; w++) {
      const week: any[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (w * 7) + d);
        
        const dateStr = date.toISOString().split('T')[0];
        week.push({
          date: dateStr,
          count: dataMap.get(dateStr) || 0
        });

        if (d === 0 && date.getMonth() !== currentMonth) {
          currentMonth = date.getMonth();
          months.push({
            name: date.toLocaleString('default', { month: 'short' }),
            weekIdx: w
          });
        }
      }
      weeks.push(week);
    }

    this.weeks = weeks;
    this.monthLabels = months.map(m => ({
      name: m.name,
      weekIdx: m.weekIdx
    }));
  }

  getLevel(count: number): number {
    if (count === 0) return 0;
    if (count < 5) return 1;
    if (count < 15) return 2;
    if (count < 30) return 3;
    return 4;
  }
}
