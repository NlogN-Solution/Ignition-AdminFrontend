import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMPONENT_KEYS, type BlockType } from "./blocks";
import {
  AreaField,
  Field,
  Repeater,
  StringRepeater,
  TextField,
  nested,
  rows,
  str,
  strings,
} from "./BlockFields";
import { ProseEditor } from "./ProseEditor";

/**
 * The per-type editing surface.
 *
 * Every field here exists because a component on the public site reads it —
 * the shapes are `TimelineStage`, `ChecklistItem`, `AccordionItem`,
 * `WhyUkPoint` and the hub CTA, not shapes invented for the admin. A field
 * that does not survive into a rendered page has no business being on this
 * form, because staff read the presence of a field as a promise that filling
 * it changes something.
 */
export function BlockForm({
  type,
  data,
  onChange,
}: {
  type: BlockType;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...data, [key]: value });

  switch (type) {
    case "prose":
      return (
        <div className="space-y-4">
          <TextField
            label="Heading"
            hint="Optional. Left blank, the paragraphs run on from whatever precedes them."
            value={str(data, "heading")}
            onChange={(value) => set("heading", value)}
          />
          <Field label="Body">
            <ProseEditor paragraphs={strings(data, "paragraphs")} onChange={(value) => set("paragraphs", value)} />
          </Field>
          <StringRepeater
            label="Points"
            hint="Rendered as a bulleted list beneath the body."
            items={strings(data, "points")}
            onChange={(value) => set("points", value)}
            addLabel="Add point"
          />
        </div>
      );

    case "cards":
      return (
        <div className="space-y-4">
          <TextField label="Heading" value={str(data, "heading")} onChange={(value) => set("heading", value)} />
          <Repeater
            label="Cards"
            items={rows(data, "items")}
            onChange={(value) => set("items", value)}
            empty={{ title: "", body: "" }}
            addLabel="Add card"
            renderRow={(item, setField) => (
              <>
                <TextField label="Title" value={str(item, "title")} onChange={(value) => setField("title", value)} />
                <AreaField label="Body" rows={2} value={str(item, "body")} onChange={(value) => setField("body", value)} />
                <TextField
                  label="Link"
                  hint="Optional path — the whole card becomes the link."
                  value={str(item, "href")}
                  onChange={(value) => setField("href", value)}
                />
              </>
            )}
          />
        </div>
      );

    case "timeline":
      return (
        <div className="space-y-4">
          <TextField label="Heading" value={str(data, "heading")} onChange={(value) => set("heading", value)} />
          <Repeater
            label="Stages"
            hint="Rendered as one continuous numbered rail, so the order is the story."
            items={rows(data, "stages")}
            onChange={(value) => set("stages", value)}
            empty={{ label: "", description: "", meta: "" }}
            addLabel="Add stage"
            renderRow={(item, setField) => (
              <>
                <TextField label="Label" value={str(item, "label")} onChange={(value) => setField("label", value)} />
                <AreaField
                  label="Description"
                  rows={2}
                  value={str(item, "description")}
                  onChange={(value) => setField("description", value)}
                />
                <TextField
                  label="Note"
                  hint="Set to the right of the stage — a month, a duration, who does it."
                  value={str(item, "meta")}
                  onChange={(value) => setField("meta", value)}
                />
              </>
            )}
          />
        </div>
      );

    case "checklist":
      return (
        <div className="space-y-4">
          <TextField
            label="Storage key"
            hint="Ticks persist against this key in the reader's browser. Changing it on a live page resets everyone's progress."
            value={str(data, "id")}
            onChange={(value) => set("id", value)}
          />
          <TextField label="Title" value={str(data, "label")} onChange={(value) => set("label", value)} />
          <Repeater
            label="Items"
            items={rows(data, "items")}
            onChange={(value) => set("items", value)}
            empty={{ id: "", label: "", detail: "" }}
            addLabel="Add item"
            renderRow={(item, setField) => (
              <>
                <TextField label="Label" value={str(item, "label")} onChange={(value) => setField("label", value)} />
                <TextField
                  label="Detail"
                  value={str(item, "detail")}
                  onChange={(value) => setField("detail", value)}
                />
                <TextField
                  label="Item key"
                  hint="Stable per item, for the same reason as the storage key."
                  value={str(item, "id")}
                  onChange={(value) => setField("id", value)}
                />
              </>
            )}
          />
        </div>
      );

    case "faq":
      return (
        <div className="space-y-4">
          <TextField label="Heading" value={str(data, "heading")} onChange={(value) => set("heading", value)} />
          <Repeater
            label="Questions"
            hint="Also emitted as FAQ structured data, so these can appear in search results verbatim."
            items={rows(data, "items")}
            onChange={(value) => set("items", value)}
            empty={{ question: "", answer: "" }}
            addLabel="Add question"
            renderRow={(item, setField) => (
              <>
                <TextField
                  label="Question"
                  value={str(item, "question")}
                  onChange={(value) => setField("question", value)}
                />
                <AreaField
                  label="Answer"
                  rows={3}
                  value={str(item, "answer")}
                  onChange={(value) => setField("answer", value)}
                />
              </>
            )}
          />
        </div>
      );

    case "callout":
      return (
        <div className="space-y-4">
          <AreaField label="Text" rows={3} value={str(data, "text")} onChange={(value) => set("text", value)} />
          <Field label="Tone" hint="“Official” is the treatment for anything deferring to a government or regulator.">
            <Select value={str(data, "tone") || "info"} onValueChange={(value) => set("tone", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="official">Official</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <TextField label="Link" value={str(data, "href")} onChange={(value) => set("href", value)} />
          <TextField
            label="Link label"
            value={str(data, "linkLabel")}
            onChange={(value) => set("linkLabel", value)}
          />
        </div>
      );

    case "stats":
      return (
        <Repeater
          label="Figures"
          hint="Anything that changes between years must carry its year in the source, so a stale figure is visibly stale rather than quietly wrong."
          items={rows(data, "items")}
          onChange={(value) => set("items", value)}
          empty={{ id: "", tone: "blue", stat: "", statNote: "", title: "", body: "", source: "" }}
          addLabel="Add figure"
          renderRow={(item, setField) => (
            <>
              <TextField
                label="Figure"
                hint="Set large at the top of the card."
                value={str(item, "stat")}
                onChange={(value) => setField("stat", value)}
              />
              <TextField
                label="Figure note"
                value={str(item, "statNote")}
                onChange={(value) => setField("statNote", value)}
              />
              <TextField label="Title" value={str(item, "title")} onChange={(value) => setField("title", value)} />
              <AreaField label="Body" rows={2} value={str(item, "body")} onChange={(value) => setField("body", value)} />
              <TextField
                label="Source"
                hint="Who says so, and when."
                value={str(item, "source")}
                onChange={(value) => setField("source", value)}
              />
              <Field label="Colour">
                <Select value={str(item, "tone") || "blue"} onValueChange={(value) => setField("tone", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="navy">Navy</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
        />
      );

    case "list":
      return (
        <div className="space-y-4">
          <TextField label="Heading" value={str(data, "heading")} onChange={(value) => set("heading", value)} />
          <StringRepeater
            label="Items"
            items={strings(data, "items")}
            onChange={(value) => set("items", value)}
            addLabel="Add item"
          />
        </div>
      );

    case "cta": {
      const primary = nested(data, "primary");
      const secondary = nested(data, "secondary");
      return (
        <div className="space-y-4">
          <TextField label="Title" value={str(data, "title")} onChange={(value) => set("title", value)} />
          <AreaField label="Intro" rows={2} value={str(data, "intro")} onChange={(value) => set("intro", value)} />
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Primary button</p>
            <TextField
              label="Label"
              value={str(primary, "label")}
              onChange={(value) => set("primary", { ...primary, label: value })}
            />
            <TextField
              label="Link"
              value={str(primary, "href")}
              onChange={(value) => set("primary", { ...primary, href: value })}
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Secondary button — optional
            </p>
            <TextField
              label="Label"
              value={str(secondary, "label")}
              onChange={(value) => set("secondary", { ...secondary, label: value })}
            />
            <TextField
              label="Link"
              value={str(secondary, "href")}
              onChange={(value) => set("secondary", { ...secondary, href: value })}
            />
          </div>
        </div>
      );
    }

    case "component":
      return (
        <div className="space-y-4">
          <Field
            label="Tool"
            hint="The list is fixed in code, on both sides. A key that is not on it renders as nothing rather than as an error."
          >
            <Select
              value={str(data, "key") || COMPONENT_KEYS[0].key}
              onValueChange={(value) => set("key", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_KEYS.map((entry) => (
                  <SelectItem key={entry.key} value={entry.key}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      );
  }
}
