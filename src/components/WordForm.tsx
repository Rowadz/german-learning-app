import { useState, useEffect } from 'react';
import { useAppDispatch } from '../hooks/useAppStore';
import { addEntry, updateEntry } from '../store/entriesSlice';
import type { VocabEntry, Category } from '../types';
import { CATEGORIES } from '../types';

interface WordFormProps {
  entry?: VocabEntry;
  onSave?: () => void;
  onCancel?: () => void;
}

export function WordForm({ entry, onSave, onCancel }: WordFormProps) {
  const dispatch = useAppDispatch();
  const isEditing = !!entry;

  const [formData, setFormData] = useState({
    category: (entry?.category || 'home') as Category,
    noun: entry?.noun || '',
    phrase: entry?.phrase || '',
    example: entry?.example || '',
    translation: entry?.translation || '',
    tags: entry?.tags?.join(', ') || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entry) {
      setFormData({
        category: entry.category,
        noun: entry.noun,
        phrase: entry.phrase,
        example: entry.example,
        translation: entry.translation,
        tags: entry.tags?.join(', ') || '',
      });
    }
  }, [entry]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.noun.trim()) {
      newErrors.noun = 'Noun is required';
    }
    if (!formData.phrase.trim()) {
      newErrors.phrase = 'Phrase is required';
    }
    if (!formData.example.trim()) {
      newErrors.example = 'Example is required';
    }
    if (!formData.translation.trim()) {
      newErrors.translation = 'Translation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const entryData = {
      category: formData.category,
      noun: formData.noun.trim(),
      phrase: formData.phrase.trim(),
      example: formData.example.trim(),
      translation: formData.translation.trim(),
      tags: tags.length > 0 ? tags : undefined,
    };

    if (isEditing && entry) {
      dispatch(updateEntry({ ...entry, ...entryData }));
    } else {
      dispatch(addEntry(entryData));
    }

    // Reset form if not editing
    if (!isEditing) {
      setFormData({
        category: 'home',
        noun: '',
        phrase: '',
        example: '',
        translation: '',
        tags: '',
      });
    }

    onSave?.();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Category *</span>
        </label>
        <select
          name="category"
          className="select select-bordered w-full"
          value={formData.category}
          onChange={handleChange}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Noun */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Noun (with article) *</span>
        </label>
        <input
          type="text"
          name="noun"
          placeholder="e.g., die Tür"
          className={`input input-bordered w-full ${errors.noun ? 'input-error' : ''}`}
          value={formData.noun}
          onChange={handleChange}
        />
        {errors.noun && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.noun}</span>
          </label>
        )}
      </div>

      {/* Phrase */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Phrase *</span>
        </label>
        <input
          type="text"
          name="phrase"
          placeholder="e.g., die Tür aufschließen"
          className={`input input-bordered w-full ${errors.phrase ? 'input-error' : ''}`}
          value={formData.phrase}
          onChange={handleChange}
        />
        {errors.phrase && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.phrase}</span>
          </label>
        )}
      </div>

      {/* Example */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Example Sentence (German) *</span>
        </label>
        <textarea
          name="example"
          placeholder="e.g., Ich schließe die Tür auf, wenn ich nach Hause komme."
          className={`textarea textarea-bordered w-full ${errors.example ? 'textarea-error' : ''}`}
          value={formData.example}
          onChange={handleChange}
          rows={2}
        />
        {errors.example && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.example}</span>
          </label>
        )}
      </div>

      {/* Translation */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Translation (English) *</span>
        </label>
        <textarea
          name="translation"
          placeholder="e.g., I unlock the door when I come home."
          className={`textarea textarea-bordered w-full ${errors.translation ? 'textarea-error' : ''}`}
          value={formData.translation}
          onChange={handleChange}
          rows={2}
        />
        {errors.translation && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.translation}</span>
          </label>
        )}
      </div>

      {/* Tags */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Tags (comma-separated)</span>
        </label>
        <input
          type="text"
          name="tags"
          placeholder="e.g., verbs, daily, important"
          className="input input-bordered w-full"
          value={formData.tags}
          onChange={handleChange}
        />
        <label className="label">
          <span className="label-text-alt">Optional: Add tags to help organize entries</span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Update Entry' : 'Add Entry'}
        </button>
      </div>
    </form>
  );
}
