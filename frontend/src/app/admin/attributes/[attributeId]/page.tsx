"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { attributesAdminApi } from "@/services/api/attributes-admin.api";
import type {
  Attribute,
  AttributeStatus,
  AttributeType,
  UpdateAttributeInput,
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

export default function EditAttributePage() {
  const params = useParams<{ attributeId: string }>();
  const router = useRouter();
  const attributeId = params.attributeId;

  const [attribute, setAttribute] = useState<Attribute | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AttributeType>("TEXT");
  const [options, setOptions] = useState<string[]>([]);
  const [isRequired, setIsRequired] = useState(false);
  const [isVariant, setIsVariant] = useState(false);
  const [isFilterable, setIsFilterable] = useState(false);
  const [isSearchable, setIsSearchable] = useState(false);
  const [status, setStatus] = useState<AttributeStatus>("ACTIVE");
  const [sortOrder, setSortOrder] = useState("0");

  const requiresOptions =
    type === "SELECT" || type === "MULTI_SELECT";

  const loadAttribute = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await attributesAdminApi.getById(attributeId);

      setAttribute(result);
      setName(result.name);
      setSlug(result.slug);
      setDescription(result.description ?? "");
      setType(result.type);
      setOptions([...result.options]);
      setIsRequired(result.isRequired);
      setIsVariant(result.isVariant);
      setIsFilterable(result.isFilterable);
      setIsSearchable(result.isSearchable);
      setStatus(result.status);
      setSortOrder(String(result.sortOrder));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [attributeId]);

  useEffect(() => {
    void loadAttribute();
  }, [loadAttribute]);

  const updateType = (value: AttributeType) => {
    setType(value);
    setOptions(
      value === "SELECT" || value === "MULTI_SELECT"
        ? options.length
          ? options
          : [""]
        : [],
    );
  };

  const updateOption = (index: number, value: string) => {
    setOptions((current) =>
      current.map((option, i) => (i === index ? value : option)),
    );
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

    const input: UpdateAttributeInput = {
      name: name.trim(),
      slug: slug.trim(),
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
      await attributesAdminApi.update(attributeId, input);
      await loadAttribute();
      window.alert("Attribute updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!attribute) return;

    if (
      !window.confirm(
        `Delete "${attribute.name}"?\n\nAttributes used by products cannot be deleted.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await attributesAdminApi.delete(attributeId);
      router.push("/admin/attributes");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading attribute...
      </div>
    );
  }

  if (!attribute) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-red-600">
          {error || "Attribute not found."}
        </p>
        <Link
          href="/admin/attributes"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Attributes
        </Link>
      </div>
    );
  }

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
          Edit Attribute
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Update attribute settings and available options.
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
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Slug *</label>
              <input
                required
                minLength={2}
                maxLength={160}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className={inputClass}
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
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
                  Manage the unique values available for selection.
                </p>
              </div>

              <button
                type="button"
                disabled={options.length >= 200}
                onClick={() => setOptions((current) => [...current, ""])}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
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

        <div className="flex flex-wrap justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete Attribute"}
          </button>

          <div className="flex gap-3">
            <Link
              href="/admin/attributes"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
