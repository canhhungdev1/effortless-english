import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Optional: Add logic to skip loading for certain requests
  // if (req.headers.has('X-Skip-Loading')) { ... }

  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};
