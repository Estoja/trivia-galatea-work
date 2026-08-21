export abstract class Mapper<I> {
  abstract fromMap(obj: unknown): I;
}
