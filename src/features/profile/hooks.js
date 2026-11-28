import { useMutation } from '@tanstack/react-query'
import { changePassword } from './api'

export const useChangePassword = () => useMutation({ mutationFn: changePassword })
