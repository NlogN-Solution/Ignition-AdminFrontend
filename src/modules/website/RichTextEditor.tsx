import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment,
  Autoformat,
  AutoLink,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  CodeBlock,
  Essentials,
  FindAndReplace,
  Heading,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  ListProperties,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableToolbar,
  TextTransformation,
  Underline,
  type Editor,
  type EditorConfig,
  type FileLoader,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { websiteService } from "./service";

/**
 * Images dropped or pasted into the body are uploaded to the media library
 * (the same `/media-assets/upload` the Media page uses) and the editor gets
 * back its public CDN URL.
 */
function MediaUploadAdapter(editor: Editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader: FileLoader) => ({
    upload: async () => {
      const file = await loader.file;
      if (!file) throw new Error("No file to upload");
      const asset = await websiteService.media.upload(file);
      return { default: asset.url };
    },
    abort: () => {},
  });
}

/**
 * CKEditor 5 is licensed GPL-2.0-or-later for open-source use, which is what
 * the "GPL" key selects. A closed-source deployment needs a commercial key
 * from ckeditor.com, supplied through VITE_CKEDITOR_LICENSE_KEY.
 */
const LICENSE_KEY = (import.meta.env.VITE_CKEDITOR_LICENSE_KEY as string | undefined) || "GPL";

const CONFIG: EditorConfig = {
  licenseKey: LICENSE_KEY,
  plugins: [
    Essentials, Paragraph, Heading, Autoformat, TextTransformation, PasteFromOffice, FindAndReplace,
    Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Code, RemoveFormat,
    Link, AutoLink, List, ListProperties, BlockQuote, Indent, IndentBlock, Alignment, HorizontalLine, CodeBlock,
    Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageUpload, ImageInsert, LinkImage,
    Table, TableToolbar, TableCaption,
  ],
  extraPlugins: [MediaUploadAdapter],
  toolbar: {
    items: [
      "undo", "redo", "|",
      "heading", "|",
      "bold", "italic", "underline", "strikethrough", "code", "removeFormat", "|",
      "link", "insertImage", "insertTable", "blockQuote", "codeBlock", "horizontalLine", "|",
      "alignment", "bulletedList", "numberedList", "outdent", "indent", "|",
      "subscript", "superscript", "findAndReplace",
    ],
    shouldNotGroupWhenFull: false,
  },
  // The article title is the page's H1, so the body starts at H2.
  heading: {
    options: [
      { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
      { model: "heading2", view: "h2", title: "Heading", class: "ck-heading_heading2" },
      { model: "heading3", view: "h3", title: "Subheading", class: "ck-heading_heading3" },
      { model: "heading4", view: "h4", title: "Minor heading", class: "ck-heading_heading4" },
    ],
  },
  image: {
    toolbar: [
      "imageTextAlternative", "toggleImageCaption", "|",
      "imageStyle:block", "imageStyle:side", "|",
      "resizeImage", "linkImage",
    ],
    insert: { integrations: ["upload", "url"] },
  },
  table: { contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "toggleTableCaption"] },
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: "https://",
  },
  placeholder: "Start writing…",
};

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  return (
    <div className="rich-editor">
      <CKEditor
        editor={ClassicEditor}
        config={{ ...CONFIG, initialData: value }}
        onChange={(_, editor) => onChange(editor.getData())}
      />
    </div>
  );
}
