import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/core.module';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { SharedModule } from '../../../../../../shared/shared.module';
import { appReducers } from '../../../../../../store/reducers.module';
import { AppStoreModule } from '../../../../../../store/store.module';
import { endpointStoreNames } from '../../../../../../store/types/endpoint.types';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../../../application.service';
import { ApplicationEnvVarsHelper } from './application-env-vars.service';
import { BuildTabComponent } from './build-tab.component';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';
import { HttpModule, Http, ConnectionBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../../../../core/github.helpers';

describe('BuildTabComponent', () => {
  let component: BuildTabComponent;
  let fixture: ComponentFixture<BuildTabComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BuildTabComponent,
        ViewBuildpackComponent
      ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
        HttpModule
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        AppStoreModule,
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        Http,
        {
          provide: ConnectionBackend,
          useClass: MockBackend
        },
        { provide: GITHUB_API_URL, useValue: null }
      ]
    })
      .compileComponents();
  }));

  beforeEach(inject([ApplicationService], (applicationService: ApplicationService) => {
    const cfGuid = Object.keys(initialState.requestData[endpointStoreNames.type])[0];
    const appGuid = Object.keys(initialState.requestData.application)[0];
    fixture = TestBed.createComponent(BuildTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
