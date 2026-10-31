"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

import { attributesAdminApi } from "@/services/api/attributes-admin.api";
import type {
  AttributeStatus,
  AttributeType,
  CreateAttributeInput,
} from "@/features/attributes/attribute.types";
import { getErrorMessage } from "@/features/attributes/attribute-error";

const TYPES: AttributeType[] = [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200";

export default function NewAttributePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AttributeType>("TEXT");
  const [options, setOptions] = useState<string[]>([""]);
  const [isRequired, setIsRequired] = useState(false);
  const [isVariant, setIsVariant] = useState(false);
  const [isFilterable, setIsFilterable] = useState(false);
  const [isSearchable, setIsSearchable] = useState(false);
  const [status, setStatus] = useState<AttributeStatus>("ACTIVE");
  const [sortOrder, setSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const requiresOptions =
    type === "SELECT" || type === "MULTI_SELECT";

  const makeSlug = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const updateType = (value: AttributeType) => {
    setType(value);
    setOptions(
      value === "SELECT" || value === "MULTI_SELECT"
        ? [""]
        : [],
    );
  };

  const updateOption = (index: number, value: string) => {
    setOptions((current) =>
      current.map((option, i) => (i === index ? value : option)),
    );
  };

  const addOption = () => {
    setOptions((current) => [...current, ""]);
  };

  const removeOption = (index: number) => {
    setOptions((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedOptions = options
      .map((option) => option.trim())
      .filter(Boolean);

    if (requiresOptions && normalizedOptions.length === 0) {
      setError("At least one option is required for this attribute type.");
      return;
    }

    if (
      !requiresOptions &&
      normalizedOptions.length > 0
    ) {
      setError("Options are only allowed for SELECT and MULTI_SELECT.");
      return;
    }

    if (
      new Set(normalizedOptions.map((option) => option.toLowerCase())).size !==
      normalizedOptions.length
    ) {
      setError("Duplicate options are not allowed.");
      return;
    }

    const numericSortOrder = Number(sortOrder);

    if (
      !Number.isInteger(numericSortOrder) ||
      numericSortOrder < 0 ||
      numericSortOrder > 1_000_000
    ) {
      setError("Sort order must be an integer from 0 to 1,000,000.");
      return;
    }

    const input: CreateAttributeInput = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      type,
      options: requiresOptions ? normalizedOptions : [],
      isRequired,
      isVariant,
      isFilterable,
      isSearchable,
      status,
      sortOrder: numericSortOrder,
    };

    setSaving(true);

    try {
      const created = await attributesAdminApi.create(input);
      router.push(`/admin/attributes/${created._id}`);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <Link
          href="/admin/attributes"
          className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Attributes
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create Attribute
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Define a reusable product attribute.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
      >
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Name *</label>
              <input
                required
                minLength={2}
                maxLength={120}
                className={inputClass}
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);
                  if (!slugEdited) setSlug(makeSlug(value));
                }}
                placeholder="e.g. Color"
              />
            </div>

            <div>
              <label className={labelClass}>Slug</label>
              <input
                minLength={2}
                maxLength={160}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className={inputClass}
                value={slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(makeSlug(event.target.value));
                }}
                placeholder="color"
              />
              <p className="mt-1 text-xs text-gray-400">
                Lowercase letters, numbers and hyphens.
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              maxLength={2000}
              rows={3}
              className={inputClass}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe this attribute..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Attribute Type *</label>
              <select
                className={inputClass}
                value={type}
                onChange={(event) =>
                  updateType(event.target.value as AttributeType)
                }
              >
                {TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as AttributeStatus)
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Sort Order</label>
              <input
                type="number"
                min={0}
                max={1000000}
                step={1}
                className={inputClass}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </div>
          </div>
        </section>

        {requiresOptions && (
          <section className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Attribute Options *
                </h2>
                <p className="text-xs text-gray-500">
                  Add unique values customers or admins can select.
                </p>
              </div>

              <button
                type="button"
                onClick={addOption}
                disabled={options.length >= 200}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus size={16} />
                Add option
              </button>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    required
                    maxLength={120}
                    className={inputClass}
                    value={option}
                    onChange={(event) =>
                      updateOption(index, event.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                  />

                  <button
                    type="button"
                    disabled={options.length <= 1}
                    onClick={() => removeOption(index)}
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
                    title="Remove option"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>

            {type === "MULTI_SELECT" && (
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Multiple values may be selected for this attribute.
              </p>
            )}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Attribute Behavior
          </h2>

          {[
            {
              label: "Required",
              description: "A value must be provided when applicable.",
              value: isRequired,
              set: setIsRequired,
            },
            {
              label: "Variant Attribute",
              description: "This attribute can define product variants.",
              value: isVariant,
              set: setIsVariant,
            },
            {
              label: "Filterable",
              description: "Customers can filter products by this attribute.",
              value: isFilterable,
              set: setIsFilterable,
            },
            {
              label: "Searchable",
              description: "This attribute can be used in search.",
              value: isSearchable,
              set: setIsSearchable,
            },
          ].map((item) => (
            <label
              key={item.label}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
            >
              <input
                type="checkbox"
                checked={item.value}
                onChange={(event) => item.set(event.target.checked)}
                className="mt-1 h-4 w-4 accent-blue-600"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </span>
                <span className="text-xs text-gray-500">
                  {item.description}
                </span>
              </span>
            </label>
          ))}
        </section>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Link
            href="/admin/attributes"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? "Creating..." : "Create Attribute"}
          </button>
        </div>
      </form>
    </div>
  );
}
