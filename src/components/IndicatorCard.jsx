export default function IndicatorCard({ IndicatorTitle, IndicatorId, GraphTypes }) {
    return (
        <div className="card bg-base-100 w-96 shadow-sm">
            <figure className="px-10 pt-10">
                <img
                src="../../public/graph.png"
                alt="Shoes"
                class="rounded-xl" />
            </figure>
            <div className="card-body items-center text-center">
                <h2 className="card-title">{IndicatorTitle}</h2>
                <div className="card-actions">
                    {GraphTypes.map((graphType) => (
                        <button className="btn btn-primary">{graphType.icon}</button> 
                    ))}
                </div>
            </div>
        </div>
    )
}

