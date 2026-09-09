import styles from "./sections.module.css";

/** A compact three-column reference table used by several design-system sections. */
interface SpecimenTableProps {
  caption: string;
  headers: readonly [string, string, string];
  rows: ReadonlyArray<readonly [string, string, string]>;
}

export function SpecimenTable({ caption, headers, rows }: SpecimenTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="label">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([token, value, use]) => (
            <tr key={token}>
              <th scope="row">
                <code className={styles.code}>{token}</code>
              </th>
              <td className="numeric">{value}</td>
              <td className="muted">{use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
