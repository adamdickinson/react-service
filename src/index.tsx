import React, { createContext, useContext } from 'react'

export interface ServiceProps {
  fallback?: React.FC | string
}

const createService = <A, P = {}>(useApi: (props: P) => A) => {
  type ServiceHook = () => A
  type ServiceComponent = React.FC<P & ServiceProps>

  const Context = createContext<A>(undefined)
  const { Provider } = Context

  const Service: ServiceComponent = props => {
    const Fallback = props.fallback
    const api = useApi(props)
    if (api !== undefined) {
      return <Provider value={api}>{props.children}</Provider>
    }

    return Fallback ? <Fallback /> : null
  }

  const useService: ServiceHook = () => useContext(Context)
  const output: [ServiceComponent, ServiceHook] = [Service, useService]
  return output
}

export default createService
