export interface Command<T> {
  execute(options?: T): Promise<boolean>;
}
