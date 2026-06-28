import { useParams } from "react-router-dom"

export function Billing(params) {

    const { id: projectId, buildId } = useParams()


    return (


        <>
            <p>{projectId} this is projectid and this is {buildId}</p>
            <p>Hello</p>

        </>

    )
}