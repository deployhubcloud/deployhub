import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, RuntimeIcon } from '../components/ui'

const projectTypes = [
  {
    id: 'static',
    name: 'Static',
    description: 'Frontend apps, documentation, and static websites.',
  },
  { id: 'node', name: 'Node.js', description: 'JavaScript servers, APIs, and backend services.' },
  { id: 'java', name: 'Java', description: 'Java applications and backend services.' },
  { id: 'go', name: 'Go', description: 'Go applications, APIs, and microservices.' },
  { id: 'python', name: 'Python', description: 'Python web apps, APIs, and services.' },
]

export default function ProjectTypes() {
  return (
    <div className="project-type-picker">
      <PageHeader
        eyebrow="NEW PROJECT"
        title="What are you building?"
        description="Choose your project type to get started."
      >
        <Link className="btn" to="/projects">
          <ArrowLeft size={15} />
          All projects
        </Link>
      </PageHeader>
      <div className="project-type-options" aria-label="Project types">
        {projectTypes.map(({ id, name, description }) => (
          <Link
            key={id}
            to={`/projects/new/${id}`}
            className="project-type-option"
            aria-label={`Create ${name} project`}
          >
            <RuntimeIcon type={id} />
            <div>
              <h2>{name}</h2>
              <p>{description}</p>
            </div>
            <ArrowRight size={18} className="project-type-arrow" />
          </Link>
        ))}
      </div>
      <p className="project-type-note">Next, choose a plan and connect your repository.</p>
    </div>
  )
}
