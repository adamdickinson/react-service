import React, { createContext, useContext } from 'react'

export interface ServiceProps {
  fallback?: React.FC | string
}

type ServiceComponent<P> = React.FC<P & ServiceProps>
type ServiceHook<A> = () => A

const createService = <A, P = {}>(
  useApi: (props: P) => A
): [ServiceComponent<P>, ServiceHook<A>] => {

  const Context = createContext<A>(undefined)
  const { Provider } = Context

  const Service: ServiceComponent<P> = props => {
    const Fallback = props.fallback
    const api = useApi(props)
    if (api !== undefined) {
      return <Provider value={api}>{props.children}</Provider>
    }

    return Fallback ? <Fallback /> : null
  }

  const useService: ServiceHook<A> = () => useContext(Context)
  return [Service, useService]
}

export default createService
