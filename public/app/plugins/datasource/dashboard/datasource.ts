import { Observable, map, of } from 'rxjs';

import {
  DataSourceApi,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  TestDataSourceResponse,
} from '@grafana/data';
import { SceneDataProvider, SceneDataTransformer, SceneObject } from '@grafana/scenes';
import { PanelEditor } from 'app/features/dashboard-scene/panel-edit/PanelEditor';
import {
  findVizPanelByKey,
  getQueryRunnerFor,
  getVizPanelKeyForPanelId,
} from 'app/features/dashboard-scene/utils/utils';

import { DashboardQuery } from './types';

/**
 * This should not really be called
 */
export class DashboardDatasource extends DataSourceApi<DashboardQuery> {
  constructor(instanceSettings: DataSourceInstanceSettings) {
    super(instanceSettings);
  }

  getCollapsedText(query: DashboardQuery) {
    return `Dashboard Reference: ${query.panelId}`;
  }

  query(options: DataQueryRequest<DashboardQuery>): Observable<DataQueryResponse> {
    const scene: SceneObject | undefined = options.scopedVars?.__sceneObject?.value;

    if (!scene) {
      throw new Error('Can only be called from a scene');
    }

    const query = options.targets[0];
    if (!query) {
      return of({ data: [] });
    }

    const panelId = query.panelId;

    if (!panelId) {
      return of({ data: [] });
    }

    let sourcePanel = this.findSourcePanel(scene, panelId);

    if (!sourcePanel) {
      return of({ data: [], error: { message: 'Could not find source panel' } });
    }

    let sourceDataProvider: SceneDataProvider | undefined = getQueryRunnerFor(sourcePanel);

    if (!sourceDataProvider || !sourceDataProvider.getResultsStream) {
      return of({ data: [] });
    }

    if (query.withTransforms && sourceDataProvider.parent) {
      const transformer = sourceDataProvider.parent;
      if (transformer && transformer instanceof SceneDataTransformer) {
        sourceDataProvider = transformer;
      }
    }

    if (!sourceDataProvider?.isActive) {
      sourceDataProvider?.activate();
      sourceDataProvider.setContainerWidth!(500);
    }

    return sourceDataProvider.getResultsStream!().pipe(
      map((result) => {
        return {
          data: result.data.series,
          state: result.data.state,
          errors: result.data.errors,
          error: result.data.error,
        };
      })
    );
  }

  private findSourcePanel(scene: SceneObject, panelId: number) {
    let sceneToSearch = scene.getRoot();

    if (sceneToSearch instanceof PanelEditor) {
      sceneToSearch = sceneToSearch.state.dashboardRef.resolve();
    }

    return findVizPanelByKey(sceneToSearch, getVizPanelKeyForPanelId(panelId));
  }

  testDatasource(): Promise<TestDataSourceResponse> {
    return Promise.resolve({ message: '', status: '' });
  }
}
