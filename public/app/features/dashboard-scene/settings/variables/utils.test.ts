import { setTemplateSrv, TemplateSrv } from '@grafana/runtime';
import {
  CustomVariable,
  ConstantVariable,
  IntervalVariable,
  QueryVariable,
  DataSourceVariable,
  AdHocFiltersVariable,
  TextBoxVariable,
} from '@grafana/scenes';
import { VariableType } from '@grafana/schema';

import { AdHocFiltersVariableEditor } from './editors/AdHocFiltersVariableEditor';
import { ConstantVariableEditor } from './editors/ConstantVariableEditor';
import { CustomVariableEditor } from './editors/CustomVariableEditor';
import { DataSourceVariableEditor } from './editors/DataSourceVariableEditor';
import { IntervalVariableEditor } from './editors/IntervalVariableEditor';
import { QueryVariableEditor } from './editors/QueryVariableEditor';
import { TextBoxVariableEditor } from './editors/TextBoxVariableEditor';
import {
  isEditableVariableType,
  EDITABLE_VARIABLES,
  EDITABLE_VARIABLES_SELECT_ORDER,
  getVariableTypeSelectOptions,
  getVariableEditor,
  getVariableScene,
  hasVariableOptions,
  EditableVariableType,
} from './utils';

const templateSrv = {
  getAdhocFilters: jest.fn().mockReturnValue([{ key: 'origKey', operator: '=', value: '' }]),
} as unknown as TemplateSrv;

describe('isEditableVariableType', () => {
  it('should return true for editable variable types', () => {
    const editableTypes: VariableType[] = ['custom', 'query', 'constant', 'interval', 'datasource', 'adhoc', 'textbox'];
    editableTypes.forEach((type) => {
      expect(isEditableVariableType(type)).toBe(true);
    });
  });

  it('should return false for non-editable variable types', () => {
    const nonEditableTypes: VariableType[] = ['system'];
    nonEditableTypes.forEach((type) => {
      expect(isEditableVariableType(type)).toBe(false);
    });
  });
});

describe('getVariableTypeSelectOptions', () => {
  it('should contain all editable variable types', () => {
    const options = getVariableTypeSelectOptions();
    expect(options).toHaveLength(Object.keys(EDITABLE_VARIABLES).length);

    EDITABLE_VARIABLES_SELECT_ORDER.forEach((type) => {
      expect(EDITABLE_VARIABLES).toHaveProperty(type);
    });
  });

  it('should return an array of selectable values for editable variable types', () => {
    const options = getVariableTypeSelectOptions();
    expect(options).toHaveLength(7);

    options.forEach((option, index) => {
      const editableType = EDITABLE_VARIABLES_SELECT_ORDER[index];
      const variableTypeConfig = EDITABLE_VARIABLES[editableType];

      expect(option.value).toBe(editableType);
      expect(option.label).toBe(variableTypeConfig.name);
      expect(option.description).toBe(variableTypeConfig.description);
    });
  });
});

describe('getVariableEditor', () => {
  it.each(Object.keys(EDITABLE_VARIABLES) as EditableVariableType[])(
    'should define an editor for every variable type',
    (type) => {
      const editor = getVariableEditor(type);
      expect(editor).toBeDefined();
    }
  );

  it.each([
    ['custom', CustomVariableEditor],
    ['query', QueryVariableEditor],
    ['constant', ConstantVariableEditor],
    ['interval', IntervalVariableEditor],
    ['datasource', DataSourceVariableEditor],
    ['adhoc', AdHocFiltersVariableEditor],
    ['textbox', TextBoxVariableEditor],
  ])('should return the correct editor for each variable type', (type, ExpectedVariableEditor) => {
    expect(getVariableEditor(type as EditableVariableType)).toBe(ExpectedVariableEditor);
  });
});

describe('getVariableScene', () => {
  beforeAll(() => {
    setTemplateSrv(templateSrv);
  });

  it.each(Object.keys(EDITABLE_VARIABLES) as EditableVariableType[])(
    'should define a scene object for every variable type',
    (type) => {
      const variable = getVariableScene(type, { name: 'foo' });
      expect(variable).toBeDefined();
    }
  );

  it.each([
    ['custom', CustomVariable],
    ['query', QueryVariable],
    ['constant', ConstantVariable],
    ['interval', IntervalVariable],
    ['datasource', DataSourceVariable],
    ['adhoc', AdHocFiltersVariable],
    ['textbox', TextBoxVariable],
  ])('should return the scene variable instance for the given editable variable type', () => {
    const initialState = { name: 'MyVariable' };
    const sceneVariable = getVariableScene('custom', initialState);
    expect(sceneVariable).toBeInstanceOf(CustomVariable);
    expect(sceneVariable.state.name).toBe(initialState.name);
  });
});

describe('hasVariableOptions', () => {
  it('should return true for scene variables with options property', () => {
    const variableWithOptions = new CustomVariable({
      name: 'MyVariable',
      options: [{ value: 'option1', label: 'Option 1' }],
    });
    expect(hasVariableOptions(variableWithOptions)).toBe(true);
  });

  it('should return false for scene variables without options property', () => {
    const variableWithoutOptions = new ConstantVariable({ name: 'MyVariable' });
    expect(hasVariableOptions(variableWithoutOptions)).toBe(false);
  });
});
