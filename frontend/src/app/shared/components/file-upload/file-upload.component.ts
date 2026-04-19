import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-container">
      <input 
        type="file" 
        #fileInput 
        (change)="onFileSelected($event)" 
        [accept]="accept" 
        style="display: none"
      >
      <button type="button" class="upload-btn" (click)="fileInput.click()" [disabled]="isUploading">
         <span *ngIf="!isUploading">📤 Upload {{ label }}</span>
         <span *ngIf="isUploading">⏳ Uploading...</span>
      </button>
      <div *ngIf="error" class="error-msg">{{ error }}</div>
    </div>
  `,
  styles: [`
    .upload-container { display: inline-block; }
    .upload-btn {
      background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 8px 16px;
      border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.2s; white-space: nowrap;
      &:hover:not(:disabled) { background: #e2e8f0; border-color: #cbd5e1; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .error-msg { color: #ef4444; font-size: 11px; margin-top: 4px; }
  `]
})
export class FileUploadComponent {
  @Input() accept = '*/*';
  @Input() label = 'File';
  @Input() courseId = '';
  @Input() lessonId = '';
  @Output() uploaded = new EventEmitter<string>();


  
  isUploading = false;
  error = '';

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    this.error = '';

    const formData = new FormData();
    formData.append('file', file);

    let url = `${environment.apiUrl}/upload`;
    const params = [];
    if (this.courseId) params.push(`courseId=${this.courseId}`);
    if (this.lessonId) params.push(`lessonId=${this.lessonId}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }


    this.http.post<any>(url, formData).subscribe({


      next: (res) => {
        this.uploaded.emit(res.url);
        this.isUploading = false;
        event.target.value = ''; // Reset input
      },
      error: (err) => {
        console.error('Upload error', err);
        this.error = 'Upload failed';
        this.isUploading = false;
        event.target.value = '';
      }
    });
  }
}
