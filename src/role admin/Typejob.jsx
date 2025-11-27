import { useNavigate } from 'react-router-dom';
import './Typejob.css';
import maImg from '../../pic/ma.png';
import percallImg from '../../pic/percall.png';
import projectImg from '../../pic/project.png';

const jobTypes = [
  {
    key: 'ma',
    title: 'Maintenance Agreement (MA)',
    image: maImg,
    bodyColor: '#e5efff',
    footerColor: '#4785FC ',
  },
  {
    key: 'percall',
    title: 'Per Call',
    image: percallImg,
    bodyColor: '#d6f4e5',
    footerColor: '#019B5F',
  },
  {
    key: 'project',
    title: 'Project',
    image: projectImg,
    bodyColor: '#ffe7cf',
    footerColor: '#FEB161',
  },
];

export default function Typejob() {
  const navigate = useNavigate();

  const handleSelect = (key) => {
    if (key === 'ma') {
      navigate('/admin/create-job/ma');
    }
  };

  return (
    <div className="typejob-page">
      <div className="typejob-banner">
        <h2>Create job</h2>
      </div>

      <div className="typejob-grid">
        {jobTypes.map((item) => (
          <button
            key={item.key}
            type="button"
            className="typejob-card"
            style={{ '--card-body': item.bodyColor, '--card-footer': item.footerColor }}
            onClick={() => handleSelect(item.key)}
          >
            <div className="typejob-card-body">
              <img src={item.image} alt={item.title} className="typejob-img" />
            </div>
            <div className="typejob-card-footer">
              <span>{item.title}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
