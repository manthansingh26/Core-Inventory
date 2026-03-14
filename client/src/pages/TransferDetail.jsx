import { useParams } from 'react-router-dom';
import StockMoveDetail from '../components/StockMoveDetail';
export default function TransferDetail() {
  const { id } = useParams();
  return <StockMoveDetail id={id} type="transfer" />;
}
