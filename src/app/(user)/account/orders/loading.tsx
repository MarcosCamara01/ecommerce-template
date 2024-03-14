import { Loader } from "@/components/Loader";

export default function Loading() {
    return <div className='spinner-center'>
        <Loader height={25} width={25} />
    </div>
}