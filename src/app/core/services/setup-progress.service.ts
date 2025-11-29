import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TenantService, TenantSetupStatus } from './tenant.service';

export interface SetupProgress {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  isComplete: boolean;
  completedFields: string[];
  missingFields: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SetupProgressService {
  private progressSubject = new BehaviorSubject<SetupProgress>({
    currentStep: 1,
    totalSteps: 4,
    stepName: 'Basic Information',
    isComplete: false,
    completedFields: [],
    missingFields: []
  });

  public progress$ = this.progressSubject.asObservable();

  constructor(private tenantService: TenantService) {}

  /**
   * Calculate setup progress based on tenant setup status
   */
  updateProgress(setupStatus: TenantSetupStatus): void {
    const allFields = ['Business Name', 'Mobile', 'Address', 'City', 'State'];
    const completedFields = allFields.filter(field => !setupStatus.missingFields.includes(field));
    
    let currentStep = 1;
    let stepName = 'Getting Started';

    if (completedFields.includes('Business Name')) {
      currentStep = 2;
      stepName = 'Contact Information';
    }
    
    if (completedFields.includes('Mobile')) {
      currentStep = 3;
      stepName = 'Location Details';
    }
    
    if (completedFields.includes('Address') && completedFields.includes('City') && completedFields.includes('State')) {
      currentStep = 4;
      stepName = 'Setup Complete';
    }

    const progress: SetupProgress = {
      currentStep,
      totalSteps: 4,
      stepName,
      isComplete: setupStatus.isSetupComplete,
      completedFields,
      missingFields: setupStatus.missingFields
    };

    this.progressSubject.next(progress);
  }

  /**
   * Get current progress without updating
   */
  getCurrentProgress(): SetupProgress {
    return this.progressSubject.value;
  }

  /**
   * Reset progress to initial state
   */
  resetProgress(): void {
    this.progressSubject.next({
      currentStep: 1,
      totalSteps: 4,
      stepName: 'Basic Information',
      isComplete: false,
      completedFields: [],
      missingFields: []
    });
  }

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(): number {
    const progress = this.getCurrentProgress();
    return Math.round((progress.completedFields.length / 5) * 100);
  }
}