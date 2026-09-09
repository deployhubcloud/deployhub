import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/apiclient'

export function useApi(path, key) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision((r) => r + 1), [])
  const updateData = useCallback(
    (updater) => setState((current) => ({ ...current, data: updater(current.data) })),
    [],
  )
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: '' }))
    api
      .get(path, { signal: controller.signal })
      .then((response) => {
        if (key && !Object.hasOwn(response.data || {}, key))
          throw new Error('The service returned an incomplete response. Please try again.')
        if (active)
          setState({ data: key ? response.data[key] : response.data, loading: false, error: '' })
      })
      .catch((error) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error:
              error.response?.data?.message ||
              error.response?.data?.error ||
              'Could not connect to DeployHub. Check your connection and try again.',
          })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [path, key, revision])
  return { ...state, reload, updateData }
}
