import React, { createContext, useContext } from 'react'

export type ServiceRenderFunction<A> = (api: A) => React.ReactNode

export interface ServiceProps<A> {
  fallback?: React.FC | string
  children: React.ReactNode | ServiceRenderFunction<A>
}

type ServiceComponent<A, P> = React.FC<P & ServiceProps<A>>
type ServiceHook<A> = () => A | undefined

export const createService = <A, P = {}>(
  useApi: (props: P) => A
): [ServiceComponent<A, P>, ServiceHook<A>, React.Context<A | undefined>] => {
  const context = createContext<A | undefined>(undefined)

  const ServiceComponent = createServiceComponent<A, P>(context, useApi)

  const useService: ServiceHook<A> = () => useContext(context)
  return [ServiceComponent, useService, context]
}

const createServiceComponent = <A, P = {}>(
  context: React.Context<A | undefined>,
  useApi: (props: P) => A
): ServiceComponent<A, P> => {
  const { Provider } = context
  const Service: ServiceComponent<A, P> = ({
    children,
    fallback: Fallback,
    ...props
  }) => {
    const api = useApi(props as unknown as P)
    if (api !== undefined) {
      const renderChildren =
        typeof children === 'function' && (children as ServiceRenderFunction<A>)
      return (
        <Provider value={api}>
          {renderChildren ? renderChildren(api) : children}
        </Provider>
      )
    }

    return Fallback ? <Fallback /> : null
  }

  return Service
}

export const extendService = createServiceComponent

export default createService
