import { getPagePersonal } from "@/lib/personal";
import { FavoriteButton } from "@/components/app/favorite-button";
import { NoteEditor } from "@/components/app/note-editor";

/** Inline favorite toggle for a detail page header. */
export async function FavoriteInline({
  path,
  title,
}: {
  path: string;
  title: string;
}) {
  const { favorited } = await getPagePersonal(path);
  return (
    <FavoriteButton path={path} title={title} initialFavorited={favorited} withLabel />
  );
}

/** Private note editor for a detail page. */
export async function PageNote({
  path,
  title,
}: {
  path: string;
  title: string;
}) {
  const { note } = await getPagePersonal(path);
  return <NoteEditor path={path} title={title} initialContent={note} />;
}
