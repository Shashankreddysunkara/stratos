import { AfterContentInit, Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

import { IServicePlan } from '../../../../core/cf-api-svc.types';
import { IApp } from '../../../../core/cf-api.types';
import { pathGet, safeUnsubscribe } from '../../../../core/utils.service';
import { SetCreateServiceInstanceApp } from '../../../../store/actions/create-service-instance.actions';
import { GetAllAppsInSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { SchemaFormConfig } from '../../schema-form/schema-form.component';
import { StepOnNextResult } from '../../stepper/step/step.component';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})
export class BindAppsStepComponent implements OnDestroy, AfterContentInit {

  @Input()
  boundAppId: string;

  validateSubscription: Subscription;
  validate = new BehaviorSubject<boolean>(true);
  serviceInstanceGuid: string;
  stepperForm: FormGroup;
  apps$: Observable<APIResource<IApp>[]>;
  guideText = 'Specify the application to bind (Optional)';
  selectedServicePlan: APIResource<IServicePlan>;
  bindingParams: object = {};
  schemaFormConfig: SchemaFormConfig;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.stepperForm = new FormGroup({
      apps: new FormControl(''),
    });
  }

  private setBoundApp() {
    if (this.boundAppId) {
      this.stepperForm.controls.apps.setValue(this.boundAppId);
      this.stepperForm.controls.apps.disable();
      this.guideText = 'Specify binding params (optional)';
    }
  }

  ngAfterContentInit() {
    this.apps$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      switchMap(createServiceInstance => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, createServiceInstance.spaceGuid);
        return getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(createServiceInstance.cfGuid, createServiceInstance.spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(applicationSchemaKey)
          )
        }, true).entities$;
      }));
    this.setBoundApp();
  }

  onEnter = (selectedServicePlan: APIResource<IServicePlan>) => {
    if (selectedServicePlan) {
      // Don't overwrite if it's null (we've returned to this step from the next)
      this.selectedServicePlan = selectedServicePlan;
    }

    // Start
    this.validateSubscription = this.stepperForm.controls['apps'].valueChanges.subscribe(app => {
      if (!app) {
        // If there's no app selected the step will always be valid
        this.validate.next(true);
      }
    });

    if (!this.schemaFormConfig) {
      // Create new config
      this.schemaFormConfig = {
        schema: pathGet('entity.schemas.service_binding.create.parameters', this.selectedServicePlan),
      };
    } else {
      // Update existing config (retaining any existing config)
      this.schemaFormConfig = {
        ...this.schemaFormConfig,
        initialData: this.bindingParams,
        schema: pathGet('entity.schemas.service_binding.create.parameters', this.selectedServicePlan)
      };
    }

  }

  setBindingParams(data) {
    this.bindingParams = data;
  }

  setParamValid(valid: boolean) {
    this.validate.next(valid);
  }

  submit = (): Observable<StepOnNextResult> => {
    this.store.dispatch(new SetCreateServiceInstanceApp(this.stepperForm.controls.apps.value, this.bindingParams));
    return observableOf({
      success: true,
      data: this.selectedServicePlan
    });
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.validateSubscription);
  }

}
