export abstract class Rule {
  static checkAll(rules: Rule[]) {
    for (const rule of rules) {
      rule.check();
    }
  }

  check() {
    if (!this.isRespected()) {
      throw this.createError();
    }
  }

  abstract isRespected(): boolean;
  protected abstract createError(): Error;
}
