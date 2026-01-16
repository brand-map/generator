export abstract class RendererAbstract {
  public abstract renderString(params: { template: string; data: object }): Promise<string>;
}

export interface Config {
  generators: GeneratorConfig[];
}

export type Context<Ctx extends object = {}> = Ctx & {
  answers: Record<string, string | boolean | (string | boolean)[]>;
  errors: Error[];
};

export type DeepReadonly<T> = {
  readonly [Key in keyof T]: T[Key] extends any[] ? T[Key] : T[Key] extends object ? DeepReadonly<T[Key]> : T[Key];
};

export interface GeneratorParams {
  context: Context;
  renderer: RendererAbstract;
  generator: GeneratorConfig;
  hooks?: ActionHooks;
}

export interface ActionParams<Ctx extends object = {}> {
  context: Context<Ctx>;
  renderer: RendererAbstract;
  hooks?: ActionHooks;
}

export interface ExecuteActionParams<Ctx extends object = {}> {
  context: Context<Ctx>;
  renderer: RendererAbstract;
  action: Action;
}

export type ContextAction<Ctx extends object = {}> = (params: DeepReadonly<ExecuteActionParams<Ctx>>) => Partial<Context<Ctx>> | Promise<Partial<Context<Ctx>>>;

export interface GeneratorConfig {
  name: string;
  description?: string;
  actions: Action[];
}

export type HelperFn = (str: string) => string;

export interface TextHelpers extends Record<string, HelperFn> {}

export type Action<Ctx extends object = {}> = (params: ActionParams<Ctx>) => void | Action | Action[] | Promise<void | Action | Action[]>;

export interface ActionHooksFailures {
  path: string;
  error: string;
  message?: string;
}

export interface ActionHooksChanges {
  path: string;
}

export interface ActionHooks {
  onComment?: (msg: string) => void;
  onSuccess?: (change: ActionHooksChanges) => void;
  onFailure?: (failure: ActionHooksFailures) => void;
}

export type SetterScope = "helper" | "partial";

export interface SetOptions {
  override?: boolean;
}

export interface MappingScope {
  helper: { name: string; target: HelperFn };
  partial: { name: string; target: string };
}

interface Mapping {
  helper: HelperFn;
  partial: string;
}

type GetSetterType<Key extends SetterScope> = Mapping[Key];

export interface Setter<T extends SetterScope> {
  target: GetSetterType<T>;
  name: string;
}

export type GetReturnType<T extends SetterScope> = Mapping[T];

export interface Partials extends Record<string, string> {}
export interface Helpers extends Record<string, any> {}
