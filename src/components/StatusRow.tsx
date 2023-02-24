import { Status } from "@/models/api/mastodon/status";
import styles from "@/styles/components/StatusRow.module.scss";
import AgoLabel from "./AgoLabel";

export default function StatusRow({ status }: { readonly status: Status }) {
  return (
    <article className={styles.statusRow}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.avatar} src={status.account.avatar} alt={status.account.acct} />
      <h1 className={styles.displayName}>{status.account.display_name}</h1>
      <h2 className={styles.acct}>@{status.account.acct}</h2>
      <AgoLabel className={styles.ago} createdAt={status.created_at} />
      <div className={styles.text} dangerouslySetInnerHTML={{ __html: status.content }} />
    </article>
  );
}
