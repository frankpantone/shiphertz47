import dynamic from 'next/dynamic'

const AddressInput = dynamic(() => import('./AddressInput'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  )
})

export default AddressInput