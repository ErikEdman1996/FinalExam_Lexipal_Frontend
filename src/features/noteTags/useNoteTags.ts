import { useCallback, useEffect, useState } from 'react';
import {
  createNoteTag,
  deleteNoteTag,
  getNoteTags,
  updateNoteTag,
  type ApiNoteTag,
  type ApiNoteTagSummary,
  type CreateNoteTagPayload,
  type UpdateNoteTagPayload,
} from '../../api/api';

const sortTags = (tags: ApiNoteTagSummary[]) => {
  return [...tags].sort((left, right) => left.name.localeCompare(right.name));
};

const toSummary = (tag: ApiNoteTag, existing?: ApiNoteTagSummary): ApiNoteTagSummary => {
  return {
    ...tag,
    usageCount: existing?.usageCount ?? 0,
  };
};

export function useNoteTags() {
  const [tags, setTags] = useState<ApiNoteTagSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshTags = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await getNoteTags();
      setTags(sortTags(response));
      return response;
    } catch (error) {
      console.error('Error loading note tags:', error);
      setErrorMessage('Could not load note tags right now.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTags = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await getNoteTags();

        if (isMounted) {
          setTags(sortTags(response));
        }
      } catch (error) {
        console.error('Error loading note tags:', error);

        if (isMounted) {
          setErrorMessage('Could not load note tags right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTags();

    return () => {
      isMounted = false;
    };
  }, []);

  const createTag = useCallback(async (payload: CreateNoteTagPayload) => {
    const created = await createNoteTag(payload);

    setTags((currentTags) => sortTags([
      ...currentTags.filter((tag) => tag.id !== created.id),
      toSummary(created),
    ]));

    return created;
  }, []);

  const updateTag = useCallback(async (
    tagId: number,
    payload: UpdateNoteTagPayload,
  ) => {
    const updated = await updateNoteTag(tagId, payload);

    setTags((currentTags) => {
      const existing = currentTags.find((tag) => tag.id === tagId);

      if (!updated) {
        return sortTags(currentTags.map((tag) => (
          tag.id === tagId ? { ...tag, ...payload } : tag
        )));
      }

      return sortTags(currentTags.map((tag) => (
        tag.id === tagId ? toSummary(updated, existing) : tag
      )));
    });

    return updated;
  }, []);

  const deleteTag = useCallback(async (tagId: number) => {
    await deleteNoteTag(tagId);
    setTags((currentTags) => currentTags.filter((tag) => tag.id !== tagId));
  }, []);

  return {
    tags,
    isLoading,
    errorMessage,
    refreshTags,
    createTag,
    updateTag,
    deleteTag,
  };
}
