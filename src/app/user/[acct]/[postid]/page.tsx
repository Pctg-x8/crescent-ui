import BackLinkRow from "@/components/BackLinkRow";
import DateTimeLabel from "@/components/DateTimeLabel";
import ProdInstance, { NotFoundAPIResponseError } from "@/models/api";
import { getStatus } from "@/models/api/mastodon/status";
import { buildWebFingerAccountString, decomposeWebFingerAccount, resolveWebFingerDomainPart } from "@/models/webfinger";
import singleCardStyle from "@/styles/components/singleCard.module.scss";
import { ellipsisText, stripTags } from "@/utils";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getPost(acct: string, postid: string) {
  const instance = new ProdInstance();
  try {
    const status = await getStatus(postid).send({}, instance);
    const fullAccountPath = buildWebFingerAccountString(
      await resolveWebFingerDomainPart(decomposeWebFingerAccount(status.account.acct), instance)
    );

    return { status, fullAccountPath };
  } catch (e) {
    if (e instanceof NotFoundAPIResponseError) {
      notFound();
    } else {
      throw e;
    }
  }
}

export async function generateMetadata({
  params,
}: {
  readonly params: { readonly acct: string; readonly postid: string };
}): Promise<Metadata> {
  const { status } = await getPost(decodeURIComponent(params.acct), decodeURIComponent(params.postid));

  return {
    title: `${status.account.display_name}: "${ellipsisText(
      status.spoiler_text || status.text || stripTags(status.content)
    )}"`,
  };
}

export default async function SinglePostPage({
  params,
}: {
  readonly params: { readonly acct: string; readonly postid: string };
}) {
  const { status, fullAccountPath } = await getPost(decodeURIComponent(params.acct), decodeURIComponent(params.postid));

  return (
    <>
      <BackLinkRow />
      <article className={singleCardStyle.singleCard}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={singleCardStyle.avatarImage} src={status.account.avatar} alt={fullAccountPath} />
        <h1>
          <Link className="non-colored" href={`/@${status.account.acct}`}>
            {status.account.display_name}
          </Link>
        </h1>
        <h2>
          <Link className="sub-colored" href={`/@${status.account.acct}`}>
            @{fullAccountPath}
          </Link>
        </h2>
        <div className={singleCardStyle.content} dangerouslySetInnerHTML={{ __html: status.content }} />
        <div className={singleCardStyle.footer}>
          {status.application ? (
            <>
              {status.application.website ? (
                <a href={status.application.website}>{status.application.name}</a>
              ) : (
                status.application.name
              )}
              ・
            </>
          ) : (
            ""
          )}
          <DateTimeLabel at={status.created_at} />
        </div>
      </article>
    </>
  );
}